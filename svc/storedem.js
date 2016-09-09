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

if(config.ENABLE_STOREDEM == true)
{
	console.log('sQueue display');
	sQueue.process(processStoredem);
}

function processStoredem(job, done)
{	
    console.log("storedem job: %s", job.jobId);
	var payload = job.data.payload;
	// console.log('TEST payload:' + JSON.stringify(payload));
	var dem;
	var timeout = setTimeout(function()
	{
		exit('timeout');
	}, 300000);
	var inStream;
	var url;	
	var bz;
	var blob;
	console.log('sQueue process');
	async.series(
	{
		"getDemInfo": function(cb)
		{
			dem.user_id = payload.user_id;
			dem.dem_index = payload.dem_index;
			dem.is_public = payload.is_public;
			dem.upload_time = payload.upload_time;	
			dem.replay_blob_key = payload.replay_blob_key;
			dem.file_name = payload.file_name;
			console.log('STOREDEM finished getDemInfo');
			return cb();
		},
		"getDataSource": function(cb)
		{
			// lordstone: use the parser module to get raw match data
			url = "http://localhost:" + config.PARSER_PORT + "/redis/" + match.replay_blob_key;
			console.log('STOREDEM finished getDataSource');
			return cb();
		},
		"setUps": function(cb)
		{
			bz = spawn("bzip2");
			bz.stdin.on('error', exit);
			bz.stdout.on('error', exit);
			console.log('STOREDEM finished setUps');
			return cb();
		},
		"doZip": function(cb)
		{
			inStream = progress(request(
			{
				url: url
			}));
			inStream.pipe(bz.stdin);
			blob = stream.PassThrough();
			bz.stdout.pipe(blob);
			console.log('STOREDEM finished doZip');
			blob.on('end', cb);
		},
		"writeToDb": function(cb)
		{
			dem.blob = blob;
			storeDem(dem, db, function(err){
				if(err)
				{
					console.log('STOREDEM writetoDb err:' + err);
					return cb(err);
				}
				else
				{
					console.log('STOREDEM finished writeToDb');
					return cb();
				}
			});
		}
	}, 
	function(err)
	{
		if (err)
		{
			return done(err);
		}
		else
		{
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
						console.log('blob stll in use in parse');
						result.storedem_done = true;
						redis.set('upload_blob_mark:' + dem.replay_blob_key, result);
					}
				}
				console.log('Store dem completed');
				return done();
			});
		}// end function exit
	});

}

