/**
 * Form a queue of waiting list for dem file from
 * server, with bzip2 as the tech to compress/decompress
 * and processors
**/
var config = require('../config');
var port = config.PORT || config.STOREDEM_PORT;
var queue = require('../store/queue');
var db = require('../store/db');
var redis = require('../store/redis');
var sQueue = queue.getQueue('storedem');
var cp = require('child_process');
var progress = require('request-progress');
var stream = require('stream');
var spawn = cp.spawn;
var queries = require('../store/queries');
var storeDem = queries.storeDem;
var getDem = queries.getDem;
var async = require('async');
var request = require('request');

// lordstone: just for debug
var fs = require('fs');

if(config.ENABLE_STOREDEM == true)
{
	// console.log('sQueue ready');
	sQueue.process(processStoredem);
}

function doStoredem(payload, done)
{	
	
	var timeout = setTimeout(function()
	{
		exit('timeout');
	}, 300000);

	var url;
	var blob;
	var dem;
	console.log('sQueue process store dem');
	
	try{
		console.log('start try');
		dem = {
			user_id: payload.user_id,
			dem_index: payload.dem_index,
			is_public: payload.is_public,
			upload_time: payload.upload_time,
			replay_blob_key: payload.replay_blob_key,
			file_name: payload.file_name
		};

		console.log('STOREDEM finished getDemInfo');
		// lordstone: use the parser module to get raw match data
		url = "http://localhost:" + config.PARSER_PORT + "/redis/" + dem.replay_blob_key;
		console.log('STOREDEM finished getDataSource');

		var bz = spawn("bzip2");
		bz.stdin.on('error', exit);
		bz.stdout.on('error', exit);

		console.log('STOREDEM finished setUps');
		var inStream = progress(request(
		{
			url: url
		}));

		inStream.on('progress', function(state)
		{
			console.log(JSON.stringify(
			{
				url: url,
				state: state	
			}));
		}).on('response', function(response)
		{
			if(response.statusCode !== 200)
			{
				exit(response.statusCode.toString());
			}
		}).on('error', exit);
		
		inStream.pipe(bz.stdin);

		var midStream = stream.PassThrough();
		bz.stdout.pipe(midStream);
		console.log('STOREDEM finished doZip');
		blob = '';
		midStream.on('data', function handleStream(e)
		{
			// lordstone: escpaed before storing,
			// when retrieving from db, need to be decoding
			blob += escape(e);
		})
		.on('end', exit)
		.on('error', exit);

		function exit(err)
		{
			if (err)
			{	
				return done(err);
			}
			else
			{
				// wfs.end();
				console.time('storeDem');
				console.log('STOREDEM length:' + blob.length);
				dem.blob = blob;
				storeDem(dem, db, function(err)
				{
					if(err)
					{
						console.log('STOREDEM writetoDb err:' + err);
						done(err);
					}
					else
					{

						console.timeEnd('storeDem');
						console.log('STOREDEM finished writeToDb');
						// lordstone: if job done also for parse, del redis portion
						redis.get('upload_blob_mark:' + dem.replay_blob_key, function(err, result)
						{
							console.log('check blob in storedem:' + result);
							result = JSON.parse(result);
							if(result)
							{
								if(result.parse_done == true)
								{
									console.log('Safely delete blob');
									redis.del('upload_blob:' + dem.replay_blob_key);
									redis.del('upload_blob_mark:' + dem.replay_blob_key);
								}
								else	
								{
									console.log('blob still in use in parse');
									result.storedem_done = true;
									redis.set('upload_blob_mark:' + dem.replay_blob_key, JSON.stringify(result));
								}
							}
							console.log('Store dem completed');
							return done();
						});
					}
				});
			}
		}// end function exit

	}
	catch(e)
	{
		console.error('STOREDEM ERR:' + e);
		return done(e);
	}
}

function doGetdem(payload, done)
{
	// store dem back to redis and inform the requesting ip
	try{
		var client_ip = payload.client_ip;
		var params = {
			dem_index: payload.dem_index,
			user_id: payload.user_id
		};

		getDem(params, db, function(err, result)
		{
			if(err)
			{
				console.error('doGetdem err:' + err);
				return done(err);
			}
			
			redis.setex(
			'upload_blob:' + payload.dem_index + '_user:' + payload.user_id,
			60 * 60,
			result,
			done);
		});	
	}
	catch(e)
	{
		console.error('doGetdem err:' + e);
		return done(e);
	}
}

function processStoredem(job, done)
{	
	// lordstone: distinguish between types of jobs	
    console.log("storedem job: %s", job.jobId);
	if(!job || !job.data || !job.data.payload){
		console.log('STOREDEM: err: missing job data payload');
		return done('missing job context');
	}
	var payload = job.data.payload;
	// console.log('TEST payload:' + JSON.stringify(payload));

	var job_type = payload.job_type;

	if(job_type == 'store')
	{
		doStoredem(payload, done);
	}
	else if(job_type == 'get')
	{
		doGetdem(payload, done);
	}
	else
	{
		done();
	}
}

