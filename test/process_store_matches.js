var fs = require('fs');
var async = require('async');

var queries = require('../store/queries');
var insertMatch = queries.insertMatch;
var db = require('../store/db');
var redis = require('../store/redis');
var buildMatch = require('../store/buildMatch');

fs.readdir('replays/', function(err, files) {
	async.eachSeries(files, function(file, next) {
		var match_id = file.split('.')[0];
		console.log(match_id);

		buildMatch({
			db: db,
			redis: redis,
			match_id: match_id
		}, function(err, match) {

			insertMatch(db, redis, match, {
                type: "api",
                attempts: 1,
            }, function(err) {
            	if (err) {
            		console.log(err);
            	}
            	//process.exit(-1);
            	return next();
            });
		});
            

	}, function(err) {
		console.log('end');
	});
});
// rs = fs.createReadStream('../replays/2678898609.dem.bz2');

