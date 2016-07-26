var express = require('express');
var async = require('async');
var api = express.Router();
var constants = require('../constants');
var config = require('../config');
var request = require('request');
var rc_secret = config.RECAPTCHA_SECRET_KEY;
var multer = require('multer')(
{
    inMemory: true,
    fileSize: 100 * 1024 * 1024, // no larger than 100mb
});
var queue = require('../store/queue');
var rQueue = queue.getQueue('request');
var queries = require('../store/queries');
var buildMatch = require('../store/buildMatch');
var buildPlayer = require('../store/buildPlayer');
var buildStatus = require('../store/buildStatus');
var querystring = require('querystring');

var cheuka_session = require('../util/cheukaSession');
var user_db = require('../store/user_db');

const crypto = require('crypto');
module.exports = function(db, redis, cassandra)
{
    api.use(function(req, res, cb)
    {
        res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.header('Access-Control-Allow-Credentials', 'true');
        cb();
    });
    api.get('/metadata', function(req, res, cb)
    {
        async.parallel(
        {
            banner: function(cb)
            {
                redis.get("banner", cb);
            },
            cheese: function(cb)
            {
                redis.get("cheese_goal", function(err, result)
                {
                    return cb(err,
                    {
                        cheese: result,
                        goal: config.GOAL
                    });
                });
            },
            user: function(cb)
            {
                cb(null, req.user);
            },
            navbar_pages: function(cb)
            {
                cb(null, constants.navbar_pages);
            },
            player_pages: function(cb)
            {
                cb(null, constants.player_pages);
            },
            match_pages: function(cb)
            {
                cb(null, constants.match_pages);
            },
            player_fields: function(cb)
            {
                cb(null, constants.player_fields);
            },
        }, function(err, result)
        {
            if (err)
            {
                return cb(err);
            }
            res.json(result);
        });
    });
    api.get('/items', function(req, res)
    {
        res.json(constants.items[req.query.name]);
    });
    api.get('/abilities', function(req, res)
    {
        res.json(constants.abilities[req.query.name]);
    });

//lordstone: get all private matches for a user
/*
		api.post('/brief_match', function(req, res, cb)
		{
      if(req.session.user){  
				var user_id = req.session.user;
				var formdata = '';
				req.on('data', function(data){
		      formdata += data;
    		});
   			req.on('end', function(){
					var options = querystring.parse(formdata);
					var retval = '';
					cheuka_session.getMatchData(user_db, user_id, options, function(results)
					{
						res.json(results);
					});
				});  // end of req.on end	
			}else{
				res.json({error: "No access"});
			}
		}
*/


// modified by lordstone
    api.get('/matches/:match_id/:info?', function(req, res, cb)
    {
        var user_id = req.session.user;
        var match_id = req.params.match_id;
        buildMatch(
        {
	    user: user_id,
            db: db,
            redis: redis,
            cassandra: cassandra,
            match_id: match_id
        }, function(err, match)
        {
            if (err)
            {
                return cb(err);
            }
            if (!match)
            {
                return cb();
            }
            res.json(match);
        });
    });

    api.get('/players/:account_id/:info?/:subkey?', function(req, res, cb)
    {
        buildPlayer(
        {
            db: db,
            redis: redis,
            cassandra: cassandra,
            account_id: req.params.account_id,
            info: req.params.info,
            subkey: req.params.subkey,
            query: req.query
        }, function(err, player)
        {
            if (err)
            {
                return cb(err);
            }
            if (!player)
            {
                return cb();
            }
            res.json(player);
        });
    });
    api.get('/distributions');
    api.get('/picks/:n');
    api.get('/rankings/:hero_id');
    api.get('/status', function(req, res, cb)
    {
        buildStatus(db, redis, function(err, status)
        {
            if (err)
            {
                return cb(err);
            }
            res.json(status);
        });
    });
    //TODO @albertcui owns mmstats
    api.get('/mmstats');
    api.get('/search', function(req, res, cb)
    {
        if (!req.query.q)
        {
            return cb(400);
        }
        queries.searchPlayer(db, req.query.q, function(err, result)
        {
            if (err)
            {
                return cb(err);
            }
            res.json(result);
        });
    });
    api.get('/health/:metric?', function(req, res, cb)
    {
        redis.hgetall('health', function(err, result)
        {
            if (err)
            {
                return cb(err);
            }
            for (var key in result)
            {
                result[key] = JSON.parse(result[key]);
            }
            if (!req.params.metric)
            {
                res.json(result);
            }
            else
            {
                var single = result[req.params.metric];
                var healthy = single.metric < single.threshold;
                res.status(healthy ? 200 : 500).json(single);
            }
        });
    });

// lordstone: upload_files: copied from /request_job
// upload files: start

api.post('/upload_files', multer.array("replay_blob", 20), function(req, res, next)
  {
            if(!req.session.user){
                res.send('Please log in and use this function');
                return;
            }
            var match = [] ;
						console.log('DEBUG: upload ispublic:' + req.body.is_public);
						console.log('DEBUG: ispublic:' + req.body.is_public['is_public']);
						var is_public = JSON.parse(req.body.is_public);
						console.log('DEBUG: obj:' + JSON.stringify(is_public));
						is_public = is_public['is_public'];
            var user_id = req.session.user; // read the user_id
            if (req.files.length > 0)
            {
                const hash = crypto.createHash('md5');
                for(var i = 0; i < req.files.length; i ++)
                {
                    console.log('i file:' + req.files[i]);
                    //var key = req.files[i].name + Date.now();
	        			    var key = Math.random().toString(16).slice(2);
  	            //hash.update(req.files[i].buffer);
      	            //var key = hash.digest('hex');
                    //console.log('i:' + i + '.key:' + key);
        	    			redis.setex(new Buffer('upload_blob:' + key), 60 * 60, req.files[i].buffer);
                    match[i] = {
            	  	      replay_blob_key: key,
												user_id: user_id,
												is_public: is_public[i]
              	    };
										console.log('DEBUG: single is public:' + is_public[i]);
                } //  end for each file in files
            }
            else 
            {
                res.json(
                {
                    error: "Invalid input."
                });
            }
            if (match.length > 0)
            {
                var jobs = [];
                for(var i = 0; i < match.length; i ++)
                {
     	          console.log('match array:'+ i +':' + match[i]);
      	          queue.addToQueue(rQueue, match[i],
        	  {
          	      attempts: 1
            	  }, function(err, job)
              	  {
                      var curJob = {
                          error: err,
                          job:
                          {
                              jobId: job.jobId,
                              data: job.data
                          }
                      };
                      jobs[i] = curJob;
                      /*
                	    res.json(
                  	  {
                    	    error: err,
                      	  job:
                        	{
                          	  jobId: job.jobId,
                            	data: job.data
              	          }
                	    });
                      */
               	  });
                } // end for each match
                res.json(jobs);
            }
            else
            {
                res.json(
                {
                    error: "Invalid input."
                });
            }
  }); //end of api upload files
// end of post method
// start of the get method

 api.get('/upload_files', function(req, res, cb)
    {
        rQueue.getJob(req.query.id).then(function(job)
        {
            if (job)
            {
                job.getState().then(function(state)
                {
                    return res.json(
                    {
                        jobId: job.jobId,
                        data: job.data,
                        state: state,
                        progress: job.progress()
                    });
                }).catch(cb);
            }
            else
            {
                res.json(
                {
                    state: "failed"
                });
            }
        }).catch(cb);
    });


// End of upload_files

    api.post('/request_job', multer.single("replay_blob"), function(req, res, next)
    {
            if(!req.session.user){
                res.send('Please log in and use this function');
                return;
            }
            var match_id = Number(req.body.match_id);
	    console.log('match_id:' + match_id);
            var match;
            var user_id = req.session.user; // read the user_id
            if (req.file)
            {
                //console.log('req.file:' + req.file.);
                //var key = req.file.name + Date.now();
                // var key = Math.random().toString(16).slice(2);
                const hash = crypto.createHash('md5');
                hash.update(req.file.buffer);
                var key = hash.digest('hex');
                console.log('upload key:'+key);
                redis.setex(new Buffer('upload_blob:' + key), 60 * 60, req.file.buffer);
                match = {
                    replay_blob_key: key,
                    user_id: user_id
                };
            }
            else if (match_id && !Number.isNaN(match_id))
            {
                match = {
                    match_id: match_id,
                };
            }
            if (match)
            {
                console.log(match);
                queue.addToQueue(rQueue, match,
                {
                    attempts: 1
                }, function(err, job)
                {
                    res.json(
                    {
                        error: err,
                        job:
                        {
                            jobId: job.jobId,
                            data: job.data
                        }
                    });
                });
            }
            else
            {
                res.json(
                {
                    error: "Invalid input."
                });
            }
    });
    api.get('/request_job', function(req, res, cb)
    {
        rQueue.getJob(req.query.id).then(function(job)
        {
            if (job)
            {
                job.getState().then(function(state)
                {
                    return res.json(
                    {
                        jobId: job.jobId,
                        data: job.data,
                        state: state,
                        progress: job.progress()
                    });
                }).catch(cb);
            }
            else
            {
                res.json(
                {
                    state: "failed"
                });
            }
        }).catch(cb);
    });
    return api;
};
