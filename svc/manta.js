/**
 * Form a queue of waiting list for dem file from
 * server, with bzip2 as the tech to compress/decompress
 * and processors
**/
var config = require('../config');
var queue = require('../store/queue');
var db = require('../store/db');
var redis = require('../store/redis');
var mQueue = queue.getQueue('manta');
var cp = require('child_process');
var progress = require('request-progress');
var stream = require('stream');
var spawn = cp.spawn;
var queries = require('../store/queries');
var storeMantaResult = queries.storeMantaResult;
var getDem = queries.getDem;
var async = require('async');
var request = require('request');
var utility = require('../util/utility');
var getReplayUrl = require('../util/getReplayUrl');
var bodyParser = require('body-parser');
var ndjson = require('ndjson');
var insertMantaMatch = queries.insertMantaMatch;
var processMantaResults = require('../util/manta').processMantaResults;

if(config.ENABLE_MANTA == true)
{
	// console.log('sQueue ready');
	mQueue.process(processManta);
}

function processManta(job, cb)
{	
	/* lordstone:
		step 1: get all info from payload
		step 2: fetch raw dem data from redis
		step 3: launch the child process and set up stdin and stdout and get the output stream
		step 4:	process the output stream and store into variables
		step 5: store the variables into postgres db
	*/
	if(!job || !job.data || !job.data.payload){
		console.log('MANTA: err: missing job data payload');
		return cb('missing job context');
	}

	var match = job.data.payload;
	try{
		async.series(
		{
			"getDataSource": function(cb)
			{
				if (match.dem_index)
				{
                	match.url = "http://localhost:" + config.PARSER_PORT + "/redis/" + match.dem_index;
	                cb();
				}
				else if (match.replay_blob_key)
            	{
                	match.url = "http://localhost:" + config.PARSER_PORT + "/redis/" + match.replay_blob_key;
	                cb();
    	        }
        	    else
            	{
                	getReplayUrl(db, redis, match, cb);
	            }
			},
			"runParse": function(cb)
			{
				runParse(match, job, function(err, parsed_data)
				{
					console.log('DEBUG end of parser, storing data');
					if (err)
					{
						return cb(err);
					}
					// process parsed_data
					parsed_data.user_id = match.user_id;
					parsed_data.upload_time = match.upload_time;
					parsed_data.replay_blob_key = match.replay_blob_key;
					parsed_data.is_public = match.is_public;
					if (match.replay_blob_key)
					{
						deleteBlobAttempt(match.replay_blob_key);
						insertUploadedParse(parsed_data, cb);
					}
					else
					{
						insertStandardParse(parsed_data, cb);
					}
				});
			}
	
		}, function(err)
		{
			if(err)
			{
				console.error(err.stack || err);
			}
			return cb(err, match.match_id);
		});
	}
	catch(e)
	{
		console.error('MANTA ERR:' + e);
		return done(e);
	}
}

function deleteBlobAttempt(key)
{
	redis.get('upload_blob_mark:' + key, function(err, result)
	{
		console.log('check blob in parser:' + result);
		result = JSON.parse(result);
		if(result)
		{
			var on_use_count = 0;
			if(result.storedem)
				on_user_count += 1;
			if(result.parse)
				on_user_count += 1;
			if (on_user_count === 0)
			{
                console.log('Safely delete blob');
                redis.del("upload_blob:" + key);
                redis.del("upload_blob_mark:" + key);
            }
            else
            {
                console.log('blob still in use in storedem');
                result.removeChild('manta');
                redis.set('upload_blob_mark:' + key, JSON.stringify(result));
            }
        }
        else
        {
            console.log('No relevant redis record. Skipping');
        }
    });
} // end of deleteAttempt

function insertUploadedParse(match, cb)
{
	console.log('insertMatch');
	insertMantaMatch(db, redis, match,
	{
		type: "parsed"
	}, cb);
}

function insertStandardParse(match, cb)
{
    console.log('insertMatch');
    insertMantaMatch(db, redis, match,
    {
        type: "parsed"
    }, cb);
}


function runParse(match, job, cb)
{
	var entries = [];
	var exited = false;
	var incomplete = "incomplete";
	var timeout = setTimeout(function()
	{
		exit('timeout');
	}, 300000);

	var url = match.url;
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
		if (job)
		{
			job.progress(state.percentage * 100);
		}
	}).on('response', function(response)
	{
		if(response.statusCode !== 200)
		{
			exit(response.statusCode.toString());
		}
	}).on('error', exit);

	var bz;
    if (url && url.slice(-3) === "bz2")
    {
        bz = spawn("bunzip2");
    }
    else
    {
        var str = stream.PassThrough();
        bz = {
            stdin: str,
            stdout: str
        };
    }
	bz.stdin.on('error', exit);
	bz.stdout.on('error', exit);

	var manta_parser = spawn(config.MANTA_PATH);
	manta_parser.stdin.on('error', exit);
	manta_parser.stdout.on('error', exit);
	manta_parser.stderr.on('data', function printStdErr(data)
	{
		console.log(data.toString());
	});

	var parseStream = ndjson.parse();	
	parseStream.on('data', function handleStream(e)
	{
		if (e){
			incomplete = false;
		}
		entries.push(e);
	});
	parseStream.on('end', exit)
	parseStream.on('error', exit);
	// pipe together the streams
	inStream.pipe(bz.stdin);
	bz.stdout.pipe(manta_parser.stdin);
	manta_parser.stdout.pipe(parseStream);

	function exit(err)
	{
		if (exited)
		{	
			return;
		}
		exited = true;
		err = err || incomplete;
		clearTimeout(timeout);
		if (err)
		{
			return cb(err);
		}
		else
		{
			try
			{
				console.time('manta parse');
				var parsed_data = processMantaResults(entries);
				console.timeEnd('manta parse');
				return cb(err, parsed_data);
			}// end try
			catch (e)
			{
				return cb(e);
			}
		} // end if err
	}// end function exit
} // end run Parse

