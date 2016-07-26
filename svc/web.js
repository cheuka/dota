/**
 * Worker serving as main web application
 * Serves web/API requests
 **/
var config = require('../config');
var constants = require('../constants.js');
var utility = require('../util/utility');
var buildSets = require('../store/buildSets');
var redis = require('../store/redis');
var status = require('../store/buildStatus');
var db = require('../store/db');
var cassandra = config.ENABLE_CASSANDRA_MATCH_STORE_READ ? require('../store/cassandra') : undefined;
var queries = require('../store/queries');
var matches = require('../routes/matches');
var hyperopia = require('../routes/hyperopia');
var players = require('../routes/players');
var api = require('../routes/api');
var donate = require('../routes/donate');
var mmstats = require('../routes/mmstats');
var request = require('request');
var compression = require('compression');
var session = require('cookie-session');
var path = require('path');
var moment = require('moment');
var async = require('async');
var fs = require('fs');
var express = require('express');
var app = express();
var example_match = JSON.parse(fs.readFileSync('./matches/frontpage.json'));
var passport = require('passport');
var api_key = config.STEAM_API_KEY.split(",")[0];
var SteamStrategy = require('passport-steam').Strategy;
var host = config.ROOT_URL;
var querystring = require('querystring');
var util = require('util');
var rc_public = config.RECAPTCHA_PUBLIC_KEY;

// lordstone:
// self-defined user-session
// just for testing
var cheuka_session = require('../util/cheukaSession');
var user_db = require('../store/user_db');
// cheuka route
var cheuka_admin = require('../routes/cheuka_admin');
var cheuka_center = require('../routes/cheuka_center');
var cheuka_banpick = require('../routes/cheuka_banpick');
//PASSPORT config
passport.serializeUser(function(user, done)
{
    done(null, user.account_id);
});
passport.deserializeUser(function(account_id, done)
{
    done(null,
    {
        account_id: account_id
    });
});
passport.use(new SteamStrategy(
{
    returnURL: host + '/return',
    realm: host,
    apiKey: api_key
}, function initializeUser(identifier, profile, cb)
{
    var player = profile._json;
    player.last_login = new Date();
    queries.insertPlayer(db, player, function(err)
    {
        if (err)
        {
            return cb(err);
        }
        return cb(err, player);
    });
}));
//APP config
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'jade');
app.locals.moment = moment;
app.locals.constants = constants;
app.locals.tooltips = constants.tooltips;
app.locals.qs = querystring;
app.locals.util = util;
app.locals.config = config;
app.locals.basedir = __dirname + '/../views';
app.locals.prettyPrint = utility.prettyPrint;
app.locals.percentToTextClass = utility.percentToTextClass;
app.locals.getAggs = utility.getAggs;
app.use(compression());
app.use("/apps/dota2/images/:group_name/:image_name", function(req, res)
{
    res.header('Cache-Control', 'max-age=604800, public');
    request("http://cdn.dota2.com/apps/dota2/images/" + req.params.group_name + "/" + req.params.image_name).pipe(res);
});
app.use("/public", express.static(path.join(__dirname, '/../public')));
var sessOptions = {
    maxAge: 52 * 7 * 24 * 60 * 60 * 1000,
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
};
app.use(session(sessOptions));
app.use(passport.initialize());
app.use(passport.session());
app.use(function rateLimit(req, res, cb)
{
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || "";
    ip = ip.replace(/^.*:/, '').split(',')[0];
    var key = 'rate_limit:' + ip;
    console.log("%s visit %s, ip %s", req.user ? req.user.account_id : "anonymous", req.path, ip);
    redis.multi().incr(key).expire(key, 1).exec(function(err, resp)
    {
        if (err)
        {
            return cb(err);
        }
        if (resp[0] > 5 && config.NODE_ENV !== "test")
        {
            return res.status(429).json(
            {
                error: "rate limit exceeded"
            });
        }
        else
        {
            cb();
        }
    });
});
app.use(function telemetry(req, res, cb)
{
    var timeStart = new Date();
    if (req.path.indexOf('/names') === 0)
    {
        redis.zadd("alias_hits", moment().format('X'), moment().valueOf() + req.path);
    }
    if (req.path.indexOf('/api') === 0)
    {
        redis.zadd("api_hits", moment().format('X'), moment().valueOf() + req.path);
    }
    if (req.user)
    {
        redis.zadd('visitors', moment().format('X'), req.user.account_id);
    }
    res.once('finish', function()
    {
        var timeEnd = new Date();
        /*
        var obj = JSON.stringify({
            path: req.path,
            time: timeEnd - timeStart
        };
        */
        redis.lpush("load_times", timeEnd - timeStart);
        redis.ltrim("load_times", 0, 10000);
    });
    cb();
});
//TODO can remove this middleware with SPA
app.use(function getMetadata(req, res, cb)
{
    async.parallel(
    {
        banner: function(cb)
        {
            redis.get("banner", cb);
        },
        cheese: function(cb)
        {
            redis.get("cheese_goal", cb);
        }
    }, function(err, results)
    {
        res.locals.user = req.user;
        res.locals.banner_msg = results.banner;
        res.locals.cheese = results.cheese;
        return cb(err);
    });
});

app.use(function userAuth(req, res, next)
{
	// lordstone: if not logged in, not allowed
	if(!req.session.user)
	{
		if(req.url=='/'|| req.url=='/register')
		{
			next();
		}
		else
		{
        	res.redirect('/');				
		}
	}else if(req.session.user){
		next();
	}
});

//START service/admin routes
app.get('/robots.txt', function(req, res)
{
    res.type('text/plain');
    res.send("User-agent: *\nDisallow: /matches\nDisallow: /api");
});
app.route('/healthz').get(function(req, res)
{
    res.send("ok");
});
app.route('/login').get(passport.authenticate('steam',
{
    failureRedirect: '/'
}));
app.route('/return').get(passport.authenticate('steam',
{
    failureRedirect: '/'
}), function(req, res, next)
{
    if (config.UI_HOST)
    {
        return res.redirect(config.UI_HOST + '/players/' + req.user.account_id);
    }
    else
    {
        res.redirect('/players/' + req.user.account_id);
    }
});

//app.use('/logout', cheuka(db, redis, cassandra));

app.route('/logout').get(function(req, res)
{
    req.logout();
		if(req.session.user){
			cheuka_session.logoutUser(user_db, req.session.user, function()
			{
    		req.session = null;
				res.redirect('/');
			});
		}else{
    	res.redirect('/');
		}
});

app.use('/api', api(db, redis, cassandra));
//END service/admin routes
//START standard routes.
//TODO remove these with SPA

// user mgmt: lordstone

// self defined for cheuka dota admin

app.use('/admin', cheuka_admin(db, redis, cassandra));

app.use('/center', cheuka_center(db, redis, cassandra));

app.use('/banpick', cheuka_banpick(db, redis, cassandra));

app.route('/register').get(function(req, res, next){
//lordstone: register with invitation code
	if(req.session.user){
		res.json({error: "Please logout and retry!"});
	}else{
		res.render("user/register");
	}
});

app.route('/register').post(function(req, res, next){
//lordstone: register with invitation code
	if(req.session.user){
		res.json({error: "Please logout and retry!"});
	}else{
		var formdata = "";
		var old_user_id = req.params.user_id;
		req.on('data', function(data){
			formdata += data;
		});
		req.on('end', function(){
			//start validating username and password
			var formitems = querystring.parse(formdata);
			var user_id = formitems['user_id'];
			var password = formitems['password'];
			var invitation_code = formitems['invitation_code'];
			var new_user = {
				user_id: user_id,
				password: password,
				invitation_code: invitation_code
			};
			cheuka_session.register(user_db, new_user, function(result)
			{
				//console.log('res:' + result);
				if(result == 'success'){
					req.session.user = user_id;
					res.redirect('/');
				}else{
					res.json({error: "registration failed:" + result});
				}
			});
		});
	}
});

// upload interface

app.route('/upload').get(function(req, res, next)
{
// lordstone
	if(!req.session.user){
		res.json({error: "Please logout and retry!"});
		//res.redirect('/');
	}else{
		res.render('user/upload',
		{
			user: req.session.user,
			home: false
		});
	}
});

/*
app.route('/center').get(function(req, res, next)
{

	if(req.session.user){
		res.render('user/center',
		{
			user: req.session.user,
			func: 'center'
		});
	}else{
		res.redirect('/');
	}
});
*/

app.route('/').get(function(req, res, next)
{
// modified by lordstone
    if (req.user)
    {
        res.redirect('/players/' + req.user.account_id);
    }
    else
    {
        if(req.session.user){
		// for  user page
			res.render('home',
			{
				home: true,
				user: req.session.user,
				truncate: [2, 6],
				match: example_match	
			});	
		}
		else
		{
			res.render('home',
       		{
            	match: example_match,
        	    truncate: [2, 6], // if tables should be truncated, pass in an array of which players to display
            	home: true
        	});
		}
    }
});

app.route('/').post(function(req, res, next)
{
// lordstone's
	var formdata = "";
	req.on('data', function(data){
		formdata += data;
	});
	req.on('end', function(){
		//start validating username and password
		var formitems = querystring.parse(formdata);
		var user_id = formitems['user_id'];
		var password = formitems['password'];
		cheuka_session.checkUser(user_db, user_id, password, function(msg, t)
		{ 
			if(msg == 'success'){
				req.session.user = t.user_id;
				res.redirect('/');
			}else if(msg == 'logged'){
				res.json({error: 'User already logged in. Please log out from the previous place'});
			}else{
				res.json({error: 'auth failed'});
				//res.redirect('/');
			}
		});
	});
});

app.get('/destroyuser', function(req, res)
{
	req.session = null;
	res.redirect('/');
});

app.get('/request', function(req, res)
{
    res.render('request',
    {
	user: req.session.user,
        rc_public: rc_public
    });
});
app.route('/status').get(function(req, res, next)
{
    status(db, redis, function(err, result)
    {
        if (err)
        {
            return next(err);
        }
        res.render("status",
        {
	    user: req.session.user,
            result: result
        });
    });
});
app.use('/matches', matches(db, redis, cassandra));
app.use('/players', players(db, redis, cassandra));
app.use('/distributions', function(req, res, cb)
{
    queries.getDistributions(redis, function(err, result)
    {
        if (err)
        {
            return cb(err);
        }
	result['user']= req.session.user;
        res.render('distributions', result);
    });
});
app.get('/picks/:n?', function(req, res, cb)
{
    var length = Number(req.params.n || 1);
    var limit = 1000;
    queries.getPicks(redis,
    {
        length: length,
        limit: limit
    }, function(err, result)
    {
        if (err)
        {
            return cb(err);
        }
        res.render('picks',
        {
	    user: req.session.user,
            total: result.total,
            picks: result.entries,
            n: length,
            limit: limit,
            tabs:
            {
                1: "Monads",
                2: "Dyads",
                3: "Triads",
                /*
                4: "Tetrads",
                5: "Pentads"
                */
            }
        });
    });
});
app.get('/top', function(req, res, cb)
{
    queries.getTop(db, redis, function(err, result)
    {
        if (err)
        {
            return cb(err);
        }
	result['user'] = req.session.user;
        res.render('top', result);
    });
});
app.get('/rankings/:hero_id?', function(req, res, cb)
{
    if (!req.params.hero_id)
    {
        res.render('heroes',
        {
	    user: req.session.user,
            path: '/rankings',
            alpha_heroes: utility.getAlphaHeroes()
        });
    }
    else
    {
        queries.getHeroRankings(db, redis, req.params.hero_id,
        {
            beta: req.query.beta
        }, function(err, result)
        {
            if (err)
            {
                return cb(err);
            }
	    result['user'] = req.session.user;
            res.render('rankings', result);
        });
    }
});
app.get('/benchmarks/:hero_id?', function(req, res, cb)
{
    if (!req.params.hero_id)
    {
        return res.render('heroes',
        {
	    user: req.session.user,
            path: '/benchmarks',
            alpha_heroes: utility.getAlphaHeroes()
        });
    }
    else
    {
        queries.getBenchmarks(db, redis,
        {
            hero_id: req.params.hero_id
        }, function(err, result)
        {
            if (err)
            {
                return cb(err);
            }
	    result['user'] = req.session.user;
            res.render('benchmarks', result);
        });
    }
});
app.get('/search', function(req, res, cb)
{
    if (req.query.q)
    {
        queries.searchPlayer(db, req.query.q, function(err, result)
        {
            if (err)
            {
                cb(err);
            }
            return res.render('search',
            {
		user: req.session.user,
                query: req.query.q,
                result: result
            });
        });
    }
    else
    {
        res.render('search', {user: req.session.user});
    }
});
app.get('/april/:year?', function(req, res, cb)
{
    return res.render('plusplus',
    {
	user: req.session.user,
        match: example_match,
        truncate: [2, 6]
    });
});
app.use('/april/2016/hyperopia', hyperopia(db));
app.use('/', mmstats(redis));
//END standard routes
//TODO keep donate routes around for legacy until @albertcui can reimplement in SPA?
app.use('/', donate(db, redis));
app.use(function(req, res, next)
{
    if (config.UI_HOST)
    {
        return res.redirect(config.UI_HOST + req.url);
    }
    var err = new Error("Not Found");
    err.status = 404;
    return next(err);
});
app.use(function(err, req, res, next)
{
    res.status(err.status || 500);
    console.log(err);
    redis.zadd("error_500", moment().format('X'), req.path);
    if (config.NODE_ENV !== "development")
    {
        return res.render('error/' + (err.status === 404 ? '404' : '500'),
        {
            error: err
        });
    }
    //default express handler
    next(err);
});
var port = config.PORT || config.FRONTEND_PORT;
var server = app.listen(port, function()
{
    console.log('[WEB] listening on %s', port);
});
// listen for TERM signal .e.g. kill 
process.once('SIGTERM', gracefulShutdown);
// listen for INT signal e.g. Ctrl-C
process.once('SIGINT', gracefulShutdown);
// this function is called when you want the server to die gracefully
// i.e. wait for existing connections
function gracefulShutdown()
{
    console.log("Received kill signal, shutting down gracefully.");
    server.close(function()
    {
        console.log("Closed out remaining connections.");
        process.exit();
    });
    // if after 
    setTimeout(function()
    {
        console.error("Could not close connections in time, forcefully shutting down");
        process.exit();
    }, 30 * 1000);
}
module.exports = app;
