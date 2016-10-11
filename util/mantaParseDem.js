var config = require('../config');
var db = require('../store/db');
var redis = require('../store/redis');
var cp = require('child_process');
var ndjson = require('ndjson');
var stream = require('stream');
var spawn = cp.spawn;
var queries = require('../store/queries');
var async = require('async');
var insertMantaMatch = queries.insertMantaMatch;
var processMantaResults = require('../util/manta').processMantaResults;
var fs = require('fs');


module.exports = function(db, cb) {

	var is_match_process = {}
	db.select('match_id').from('fetch_team_match').where({
		'is_fetched': true
	}).asCallback(function(err, data){

		async.eachSeries(data, function(data_i, next) {
			db.select('is_manta_parsed').from('matches').where({
				'match_id': data_i.match_id
			}).asCallback(function(err, data) {
				if (data && data.length > 0 && data[0].is_manta_parsed) {
					// has already processed
					return next();
				}

				if (!is_match_process[data_i.match_id]) {
					is_match_process[data_i.match_id] = true;

					console.log('process match :' + data_i.match_id);

					var entries = [];
					var exited = false;
					var incomplete = "incomplete";
					var timeout = setTimeout(function()
					{
						exit('timeout');
					}, 60000);

					var rs = fs.createReadStream('replays/'+data_i.match_id+'.dem.bz2');
					var bz = spawn("bunzip2");

					bz.stdin.on('error', exit);
					bz.stdout.on('error', exit);

					var manta_parser = spawn(config.MANTA_PATH, [], {
						stdio: ['pipe', 'pipe', 'pipe'],
						encoding: 'utf8'
					});

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
					parseStream.on('end', function()
					{
						console.log('Manta finished passing data');
						exit();
					});
					parseStream.on('error', exit);
					// pipe together the streams
					rs.pipe(bz.stdin);
					bz.stdout.pipe(manta_parser.stdin);
					manta_parser.stdout.pipe(parseStream);


					function exit(err) {
						if (exited)
						{	
							return;
						}
						exited = true;
						err = err || incomplete;
						clearTimeout(timeout);
						if (err)
						{
							console.log(err);
							return next();
						}
						else
						{
							console.time('manta parse');

							var params = {};
							params.dem_index = '';
							params.replay_blob_key = '';
							params.user_id = '-1';  // admin user
							params.is_public = true;
							params.upload_time = -1;

							// console.log('MANTA JSON:\n' + JSON.stringify(entries, null, 2));
							var parsed_data = processMantaResults(entries, params);

							console.timeEnd('manta parse');
							insertMantaMatch(db, redis, parsed_data, function(err) {
								if (err) {
									console.log(err);
									return next();
								}
								else {
									var game = {
										match_id: data_i.match_id,
										is_manta_parsed: true
									};

									queries.upsert(db, 'matches', game, {
									    match_id: game.match_id	
									}, function(err) {
										console.log('insert parse status')
										return next();
									});
								}
							});
						}
					}
				}
				else {
					return next();
				}
			});
		}, function (err) {
			return cb(err);
		});
	});
}