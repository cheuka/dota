var fs = require('fs');
var async = require('async');
var queue = require('../store/queue');
var addToQueue = queue.addToQueue;
var pQueue = queue.getQueue('parse');
var utility = require('../util/utility');
var getData = utility.getData;
var generateJob = utility.generateJob;
var queries = require('../store/queries');
var insertMatch = queries.insertMatch;
var db = require('../store/db');
var redis = require('../store/redis');

fs.readdir('replays/', function(err, files) {
	async.eachSeries(files, function(file, next) {
		var match_id = file.split('.')[0];
		console.log(match_id);

		var job = generateJob("api_details",{
            match_id: match_id
        });

        getData({
            url: job.url,
            delay: 1000
        }, function(err, body) {
            if (err) {
                console.log(err);
            }
            if (body.result) {
                var match = body.result;

                match.parse_status = 0;
                match.downloaded = true;
                insertMatch(db, redis, match, {
                    type: "api",
                    attempts: 1,
                }, function(err, job) {
		            if (job) {
		                var poll = setInterval(function() {
		                    pQueue.getJob(job.jobId).then(function(job) {
		                        job.getState().then(function(state) {
		                            console.log("waiting for parse job %s for %s, currently in %s", job.jobId, match_id, state);
		                            if (state === "completed") {
		                                clearInterval(poll);
		                                // process.exit(-1);
		                                return next();
		                            }
		                            else if (state !== "active" && state !== "waiting") {
		                                clearInterval(poll);
		                                console.log('parse failed');
		                                // process.exit(-1);
		                                return next();
		                            }
		                        });
		                    });
		                }, 2000);
		            }
		        });
            }
        });

	}, function(err) {
		console.log('end');
	});
});
// rs = fs.createReadStream('../replays/2678898609.dem.bz2');

