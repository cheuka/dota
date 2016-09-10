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
var async = require('async');
var request = require('request');

if(config.ENABLE_STOREDEM == true)
{
	console.log('sQueue display');
	sQueue.process(processStoredem);
}

function processStoredem(job, done)
{	
    console.log("storedem job: %s", job.jobId);
	if(!job || !job.data || !job.data.payload){
		console.log('STOREDEM: err: missing job data payload');
		return done('missing job context');
	}
	var payload = job.data.payload;
	console.log('TEST payload:' + JSON.stringify(payload));
	var timeout = setTimeout(function()
	{
		exit('timeout');
	}, 300000);
	var url;
	var blob;
	var dem;
	console.log('sQueue process...');
	
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
			blob += e;
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
						console.log('STOREDEM finished writeToDb');
	
						// lordstone: if job done also for parse, del redis portion
						console.log('DEBUG: check blob mark, key:' + dem.replay_blob_key);
						redis.get('upload_blob_mark:' + dem.replay_blob_key, function(result)
						{
							console.log('STOREDEM exit result:' + result);
							result = JSON.parse(result);
							if(result && result.parse_done)
							{
								if(result.parse_done === true)
								{
									console.log('Safely delete blob');
									// redis.del('upload_blob:' + dem.replay_blob_key);
									redis.del('upload_blob_mark:' + dem.replay_blob_key);
								}
								else	
								{
									console.log('blob still in use in parse');
									result.storedem_done = true;
									redis.set('upload_blob_mark:' + dem.replay_blob_key, result);
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

