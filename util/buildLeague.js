var async = require('async');
var utility = require('../util/utility');
var getData = utility.getData;
var generateJob = utility.generateJob;
var db = require('../store/db');
var constants = require('../constants');
var queries = require('../store/queries');
var moment = require('moment');

var league_list = [];
var league_obj = {};

module.exports = function(db, cb) {

    console.log('start build leagues');

    var timeout = setTimeout(function() {
        console.log('exit');
        process.exit(-1);
    }, 2000*1000);

    console.time('buildLeague');

    //constants.common_teams = [111474];
    //async.eachSeries(constants.common_teams, function(team, next) {
    /*
    async.forEachLimit(constants.common_teams, 10, function(team, next) {
        var team_id = team.team_id;
        //var team_id = team;

        var url = generateJob("api_teaminfo", {
	        team_id: team_id
	    }).url;

	    getData(url, function(err, data) {
	    	var team = data.result.teams[0];
	    	for (var key in team) {
	    		if (key.indexOf('league_id_') != -1) {
                    if (!league_obj[team[key]]) {
                        league_list.push(team[key]);
                        league_obj[team[key]] = 1;
                    }
	    		}
	    	}
            console.log('list length: ', league_list.length);
            return next();
        });
    }, function(err) {
        getLeagueMatchPage(league_list, cb);
    });
    */

/*
    var url = generateJob("api_leagues", {}).url;
    getData(url, function(err, data) {
        data.result.leagues.forEach(function(league) {
            league_list.push(league.leagueid);
        });
        getLeagueMatchPage(league_list, cb);
    });
*/
    var st = moment(new Date()).unix() - 24*3600*1000;
    db.select('league_id','league_name').from('league_info').where('start_time', '>', st)
    .orderBy('start_time', 'desc').limit(100).asCallback(function(err, league) {
        console.log('league length ->' + league.length);
        async.forEachLimit(league, 5, function(league_i, next) {

            console.log('league id ->' + league_i.league_id);
            console.log('league name ->' + league_i.league_name);
             var url = generateJob("api_history", {
                leagueid: league_i.league_id
            }).url;

            getMatchPage(url, league_i.league_id, next);
        }, function(err) {

            console.timeEnd('buildLeague');
            return cb();
        });

    });



    function getMatchPage(league_url, leagueid, cb) {
        getData(league_url, function(err, data) {
            async.eachSeries(data.result.matches, function(match, next) {
                // only get match from 2016-8-1
                //if (match.start_time < 1470009600) {
                var st2 = moment(new Date()).unix() - 100*24*3600*1000;
                if (match.start_time < st2) {
                    return next('stoped fetch league 100 days ago');
                }

                //if (leagueid == 4920) {
                //console.log('radiant id = ' + match.radiant_team_id);
                //console.log('dire id = ' + match.dire_team_id);
                //}
                async.series({
                    'upsertRadiant':function(done) {
                        if (match.radiant_team_id) {
                            var tm = {
                                match_id: match.match_id,
                                team_id: match.radiant_team_id,
                                league_id: leagueid,
                                start_time: match.start_time
                            };

                            queries.upsert(db, 'fetch_team_match', tm, {
                                match_id: tm.match_id,
                                team_id: tm.team_id
                            }, function(err) {
                                return done(err);
                            });
                        }
                        else
                            return done();
                    },
                    'upsertDire':function(done) {
                        if (match.dire_team_id) {
                            var tm = {
                                match_id: match.match_id,
                                team_id: match.dire_team_id,
                                league_id: leagueid,
                                start_time: match.start_time
                            };

                            queries.upsert(db, 'fetch_team_match', tm, {
                                match_id: tm.match_id,
                                team_id: tm.team_id
                            }, function(err) {
                                return done(err);
                            });
                        }
                        else
                            return done();
                    }
                },  function(err) {
                    if (err) {
                        console.log(err);
                    }
                    return next(); 
                });
	
            }, function(err) {
                if (!err && data.result.results_remaining) {
                    var url2 = generateJob("api_history", {
                        leagueid: leagueid,
                        start_at_match_id: data.result.matches[data.result.matches.length - 1].match_id - 1,
                    }).url;
                    getMatchPage(url2, leagueid, cb);
                }
                else {
                    return cb();
                }
            });
        });
    }

}
 
