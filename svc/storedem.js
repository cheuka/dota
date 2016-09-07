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

if(config.ENABLE_STOREDEM === true)
{
	console.log('storedem');
	sQueue.process(100, processStoredem);
}

function processStoredem(job, cb)
{
	var payload = job.data.payload;
	var dem;
	var timeout = setTimeout(function()
	{
		exit('timeout');
	}, 300000);
	var inStream;
	var url;	
	var bz;
	var blob;
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
			return cb();
		},
		"getDataSource": function(cb)
		{
			// lordstone: use the parser module to get raw match data
			url = "http://localhost:" + config.PARSER_PORT + "/redis/" + match.replay_blob_key;
			return cb();
		},
		"setUps": function(cb)
		{
			bz = spawn("bzip2");
			bz.stdin.on('error', exit);
			bz.stdout.on('error', exit);
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
			blob.on('end', cb);
		},
		"writeToDb": function(cb)
		{
			dem.blob = blob;
			storeDem(dem, db, function(err){
				if(err)
				{
					return exit(err);
				}
				else
				{
					return cb();
				}
			});
		}
	}, exit);

	function exit(err)
	{
		if (err)
		{
			return cb(err);
		}
		else
		{
			// lordstone: if job done also for parse, del redis portion
			redis.get('upload_blob_mark:' + dem.replay_blob_key, function(result)
			{
				if(result && result.parse_done)
				{
					if(result.parse_done === true)
					{
						redis.del('upload_blob:' + dem.replay_blob_key);
						redis.del('upload_blob_mark:' + dem.replay_blob_key);
					}
					else
					{
						result.storedem_done = true;
						redis.set('upload_blob_mark:' + dem.replay_blob_key, result);
					}
				}
			});
		}
		console.log('Store dem completed');
		return cb();
	}

}

