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
			var is_sync = req.query.sync || null;

			var key = 'upload_blob:' + dem_index + '_user:' + user_id
			/* lordstone: check if dem is already cached in redis */
			console.log('DEBUG: check dem_index exists');
			
			redis.get((key + '_mark'), function(err, result){
				if(err)
				{
					console.error('redis check dem_index failed');
					res.send('err: cache err');
					return;
				}
				if(result)
				{
					console.log('dem_index:' + dem_index + ' exists');
					var blob_mark = JSON.parse(result);

					if(blob_mark.status == 'completed')
					{
						/* lordstone: if the backend job is completed */
						getDemFromRedis(res, key);
					}
					else if(blob_mark.status == 'wait')
					{
						/* lordstone: if the backend job is waiting */
						if(is_sync){
							waitGetdem(res, key);
						}
						else
						{	res.json({
								status: 'wait'
							});
						}
					}
					else
					{
						/* all other status is abnormal, delete the mark */
						redis.del(key + '_mark');
						res.json({
							status: 'error'
						});
					}
				}
				else
				{
					console.log('dem_index:' + dem_index + ' does not exist');
					// if it is not yet cached in redis

					var blob_mark = {
						status: 'wait'
					};

					/* set mark */
					redis.set((key + '_mark'),	JSON.stringify(blob_mark));

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

						if(is_sync)
						{
							waitGetdem(res, key);
						}
						else
						{
							res.json({
								job: JSON.stringify(job),
								status: 'wait'
							});
						}
					});
				}
			});
		}else{
			res.send('err, need to log in');
		}
	});

	function waitGetdem(res, key)
	{
		var poll = setInterval(function()
		{
			redis.get(key + '_mark', function(err, result){
				if(err)
				{
					console.error('DEBUG get sync status failed');
					clearInterval(poll);
					res.send('Sync job failed: redis issue');
					return;
				}
				var blob_mark = JSON.parse(result);
				if(blob_mark.status == 'completed')
				{
					clearInterval(poll);
					getDemFromRedis(res, key);
				}
				else if(blob_mark.status == 'error')
				{
					console.error('DEBUG get sync status failed');
					clearInterval(poll);
					res.send('Sync job failed');
					return;
				}
				
			});
		}, 2000);
	}

	function getDemFromRedis(res, key)
	{
		redis.get(key, function(err, result)
		{
			// if it is cached already in redis
			res.writeHead(200, {
				'Content-Type': 'application/x-bzip2'	
			});
			console.log('dem length:' + result.length);
			res.write(result);
			res.end();
			redis.del(key);
			redis.del(key + '_mark');
		});
	}

	return storedem;
};
