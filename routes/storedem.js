/*
 * This handles all APIs for dem storage
 * lordstone
 */

var express = require('express');
var config = require('../config');
var storedem = express.Router();
var find_all_uploads = require('../util/cheukaSession').findAllUploads;
var queue = require('../store/queue');
var sQueue = queue.getQueue('storedem');
var stream = require('stream');

module.exports = function(db, redis)
{
	/* lordstone: list all upload that is stored in db */
	storedem.get('/list', function(req, res, next)
	{
		if(req.session.user){
			var user_id = req.session.user;
			find_all_uploads(db, user_id, function(err, result)
			{
				if(err)
				{
					res.send('err:' + err);
				}else{
					res.json(result);
				}
			});
		}else{
			res.redirect('/');
		}
	});

	/* lordstone: track the job, see if the cache is ready for download */
	storedem.get('/request_job', function(req, res, cb)
	{
		sQueue.getJob(req.query.id).then(function(job)
		{
			if(job)
			{
				job.getState().then(function(state)
				{
					return res.json(
					{
						jobId: job.jobId,
						state: state
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

	storedem.get('/get_dem', function(req, res)
	{
		if(req.session.user){
			var user_id = req.session.user;
			var dem_index = req.query.dem_index;
			var key = 'upload_blob:' + dem_index + '_user:' + user_id
			/* lordstone: check if dem is already cached in redis */
			redis.exists(key, function(err, result){
				if(err)
				{
					res.send('err: cache err');
					return;
				}
				if(result)
				{
					// if it is cached already in redis
					res.writeHead(200, {
						'Content-Type': 'application/zip'	
					});
					res.write(result.blob);
					res.end();
					return;
				}
				else
				{
					// if it is not yet cached in redis
					var payload = {
						dem_index: dem_index,
						user_id: user_id,
						job_type: 'get'
					};
					console.log('DEBUG add to sQueue(get):' + dem_index);
					queue.addToQueue(sQueue, payload,
					{
						attempts: 1
					}, function(err, job)
					{
						console.log('DEBUG add done sQueue(get)' + dem_index);
						res.writeHead(202, 
							{
								'content-type': 'text/plain',
								'status': 'waiting to be cached'
							});
						res.json({
							job: job,
							status: 'wait'
						});
						res.end();
					});
				}
			});
		}else{
			res.send('err, need to log in');
		}
	});

	return storedem;
};
