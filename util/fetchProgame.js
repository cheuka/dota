var async = require('async');
var utility = require('../util/utility');
var getData = utility.getData;
var generateJob = utility.generateJob;
var db = require('../store/db');
var redis = require('../store/redis');
var constants = require('../constants');
var queries = require('../store/queries');
var insertMatch = queries.insertMatch;

var queue = require('../store/queue');
var pQueue = queue.getQueue('parse');


module.exports = function(db, cb) {

	console.log('fetch pro games by team');

    db.select('match_id', 'team_id').from('fetch_team_match').where({
        'is_fetched': false
    }).where('start_time', '>', 1474128000)
    .orderBy('start_time', 'desc')
    .asCallback(function(err, result) {
        if (!result || err)
            return cb();

        async.eachSeries(result, function(match_cur, next2) {

            var is_team_interested = false;
            var name;
            for (var i = 0; i < constants.common_teams.length; ++i) {
                if (constants.common_teams[i].team_id == match_cur.team_id) {
                    is_team_interested = true;
                    name = constants.common_teams[i].name;
                    break;
                }
            }
            
            if (!is_team_interested) {
                return next2();
            }
            console.log('interested team ' + name);

            console.log('match id ' + match_cur.match_id);
            //rxu, if we have download the match for another team, we do not
            //need to download it again
            db.select('team_id').from('fetch_team_match').where({
                'is_fetched': true,
                'match_id': match_cur.match_id
            }).asCallback(function(err, is_fetch_match) {
                if (is_fetch_match && is_fetch_match.length > 0) {
                    console.log('previous matches found');
                    var tm = {
                        team_id: match_cur.team_id,
                        match_id: match_cur.match_id,
                        is_fetched: true,
                    };

                    queries.upsert(db, 'fetch_team_match', tm, {
                        team_id: match_cur.team_id,
                        match_id: match_cur.match_id
                    }, function(err) {
                        console.log(err);
                        return next2();
                    });
                }
                else {
                    var job = generateJob("api_details",{
                            match_id: match_cur.match_id
                        });

                    getData({
                        url: job.url,
                        delay: 1000
                    }, function(err, body) {
                        if (err) {
                            console.log(err);
                            return next2();
                        }
                        if (body.result) {
                            var match = body.result;

                            match.parse_status = 0;
                            insertMatch(db, redis, match, {
                                type: "api",
                                attempts: 1,
                            }, waitParse);
                            
                            function waitParse(err, job) {
                                if (err)  {
                                    console.log('error happened');
                                    console.error(err.stack || err);
                                    return next2();
                                }

                                if (job) {
                                    var poll = setInterval(function() {
                                        pQueue.getJob(job.jobId).then(function(job) {
                                            job.getState().then(function(state) {
                                                console.log("waiting for parse job %s for %s of %s, currently in %s", job.jobId, match_cur.match_id, match_cur.team_id, state);
                                                if (state === "completed") {
                                                    clearInterval(poll);

                                                    var tm = {
                                                        team_id: match_cur.team_id,
                                                        match_id: match_cur.match_id,
                                                        is_fetched: true,
                                                    };

                                                    queries.upsert(db, 'fetch_team_match', tm, {
                                                        team_id: match_cur.team_id,
                                                        match_id: match_cur.match_id
                                                    }, function(err) {
                                                        console.log(err);
                                                        return next2();
                                                    });
                                                }
                                                else if (state !== "active" && state !== "waiting") {
                                                    clearInterval(poll);
                                                    console.log('fetch dem failed or parse failed');
                                                    return next2();
                                                }
                                            });
                                        });
                                    }, 2000);
                                }
                            }
                        }
                    }); 
                }
            });
        }, cb);
    });
	
}

