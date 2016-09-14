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
var sQueue = queue.getQueue('storedem');
var queries = require('../store/queries');
var buildMatch = require('../store/buildMatch');
var buildPlayer = require('../store/buildPlayer');
var buildStatus = require('../store/buildStatus');
var querystring = require('querystring');

var cheuka_session = require('../util/cheukaSession');
var banpick = require('../routes/banpick');
var dem = require('../routes/storedem');

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
        var is_public = JSON.parse(req.body.is_public);
        is_public = is_public['is_public'];
        var user_id = req.session.user; // read the user_id
        if (req.files.length > 0)
        {
            const hash = crypto.createHash('md5');
            for(var i = 0; i < req.files.length; i ++)
            {
                console.log('i file name:' + req.files[i].name);
                var key = Math.random().toString(16).slice(2);
				var upload_time = Math.floor(Date.now());
				var dem_index = upload_time.toString() + key;
                redis.setex(new Buffer('upload_blob:' + key), 60 * 60, req.files[i].buffer);

				// lordstone: set up mark for this blob that both parser and zipper can make use and decide whether to delete
				if(config.ENABLE_STOREDEM == true)
				{
					var mark = {
						parse_done: false,
						storedem_done: false
					};
					var mark_string = JSON.stringify(mark);
					redis.setex('upload_blob_mark:' + key, 60 * 60, mark_string);
				}

				var filename = req.files[i].name || (key + '.dem');

                match[i] = {
                    replay_blob_key: key,
                    user_id: user_id,
                    is_public: is_public[i],
					file_name: filename,
					upload_time: upload_time,
					dem_index: dem_index
                };
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
			// lordstone: change 'for' to async eachseries
			async.eachSeries(match, function(match_i, next_match)
			{
                // console.log('match array:'+ i +':' + match[i]);
				
				async.series(
				{
					"addToParseQueue": function(cb)
					{
		                queue.addToQueue(rQueue, match_i,
    		            {
        		            attempts: 1
            		    }, function(err, job)
                		{
					//		console.log('DEBUG job:' + JSON.stringify(job));
							if(job)
							{
	                	    	var curJob = {
    	                		    error: err,
        	        	        	job:
	            		            {
    	    	        	            jobId: job.jobId,
        		            	        data: job.data
		        	                }
	    	        	        };
        	        	    	jobs.push(curJob);
							}
							return cb();
	            	    });
					},

					// lordstone: store dem
					"addToStoreDemQueue": function(cb)
					{

						if(config.ENABLE_STOREDEM == true)
						{
							var dem = {
								user_id: match_i.user_id,
								dem_index: match_i.dem_index,
								is_public: match_i.is_public,
								upload_time: match_i.upload_time,
								replay_blob_key: match_i.replay_blob_key,
								file_name: match_i.file_name,
								job_type: 'store'
							};
							console.log('DEBUG add to sQueue(store):' + match_i.replay_blob_key);
		                	queue.addToQueue(sQueue, dem,
	    		            {
    	        		        attempts: 1
		        	        }, function(err, job)
        		    	    {
								console.log('DEBUG add done sQueue:' + match_i.replay_blob_key);
								return cb();
	            		    });
						}
						else
						{
							return cb();
						}            

					}
				}, function(err){
					return next_match();
				});

			}, function(err){
				console.log('Reading from upload FINISHED..');
            	res.json(jobs);
			});// end for each match
        }
        else
        {
            res.json(
            {
                error: "Invalid input."
            });
        }
    }); 
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
    //end of api upload files

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
            //var key = Math.random().toString(16).slice(2);
            const hash = crypto.createHash('md5');
            hash.update(req.file.buffer);
            var key = hash.digest('hex');
            console.log('upload key:'+key);
            redis.setex(new Buffer('upload_blob:' + key), 60 * 60, req.file.buffer);
            match = {
                replay_blob_key: key,
                user_id: user_id,
                is_public: false
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

// lordstone: added banpick api interface:
 
	api.use('/banpick', banpick(db, redis));
   	api.use('/dem', dem(db, redis));
    return api;
};
