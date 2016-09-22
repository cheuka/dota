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
    //var common_teams = [111474];
	//async.eachSeries(common_teams, function(team, cb)
	//async.eachSeries(constants.common_teams, function(team, next)
	async.forEachLimit(constants.common_teams, 1, function(team, next) {
		var team_id = team.team_id;
		//var team_id = team;

        //db.raw('select match_id, is_fetched from fetch_team_match where team_id = ? and start_time > ? order by start_time desc', [team_id, 1470009600])
        db.select('match_id').from('fetch_team_match').where({
            'team_id' : team_id,
            'is_fetched': false
        }).where('start_time', '>', 1470009600)
        .orderBy('start_time', 'desc')
        .asCallback(function(err, result) {
            if (!result || err)
                return next();
 
            async.eachSeries(result, function(match, next2) {
                //rxu, if we have download the match for another team, we do not
                //need to download again
                db.select('team_id').from('fetch_team_match').where({
                    'is_fetch': true,
                    'match_id': match.match_id
                }).asCallback(function(err, is_fetch_match) {
                    if (is_fetch_match) {
                        var tm = {
                            team_id: is_fetch_match.team_id,
                            match_id: match.match_id,
                            is_fetched: true,
                        };

                        queries.upsert(db, 'fetch_team_match', tm, {
                            team_id: is_fetch_match.team_id,
                            match_id: match.match_id
                        }, function(err) {
                            console.log(err);
                            return next2();
                        });
                    }

                    var job = generateJob("api_details",{
                        match_id: match.match_id
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
                        }
                    });
                    
                    function waitParse(err, job)
                    {
                        if (err)  {
                            console.error(err.stack || err);
                            return next2();
                        }

                        if (job) {
                            var poll = setInterval(function() {
                                pQueue.getJob(job.jobId).then(function(job) {
                                    job.getState().then(function(state) {
                                        console.log("waiting for parse job %s, currently in %s", job.jobId, state);
                                        if (state === "completed") {
                                            clearInterval(poll);

                                            var tm = {
                                                team_id: team_id,
                                                match_id: match.match_id,
                                                is_fetched: true,
                                            };

                                            queries.upsert(db, 'fetch_team_match', tm, {
                                                team_id: team_id,
                                                match_id: match.match_id
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
                });
            }, function(err) {
                return next(); 
            });
        });
	}, function(err) {
        return cb(err);
    });
}

