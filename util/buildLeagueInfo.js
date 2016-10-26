var async = require('async');
var utility = require('../util/utility');
var getData = utility.getData;
var generateJob = utility.generateJob;
var db = require('../store/db');
var constants = require('../constants');
var queries = require('../store/queries');
var median = require('median');

var url = generateJob("api_leagues", {}).url;

module.exports = function(db, cb) {
    console.log("start to fetch league info");

    var timeout = setTimeout(function() {
        console.log('exit');
        process.exit(-1);
    }, 3000*1000);

    console.time('buildLeagueInfo');

    getData(url, function(err, data) {
        async.forEachLimit(data.result.leagues, 5, function(league, next) {

        	var url2 = generateJob("api_history", {
                leagueid: league.leagueid
            }).url;

            var st_max = 0;
            updateLatestMatchTime(league, url2, st_max, function(err) {
                return next();
            });

        }, function(err) {
            console.log('finished');
            console.timeEnd('buildLeagueInfo');
            return cb();
        });

        function updateLatestMatchTime(league, url, mx, cb) {
            getData(url, function(err, data) {
                if (err) {
                    return cb(err);
                }

                var st = [];
                data.result.matches.forEach(function(m) {
                    st.push(m.start_time);
                });

                for (var i in st) {
                    mx = Math.max(mx, st[i]);
                }

                if (data.result.results_remaining) {
                    var url2 = generateJob("api_history", {
                        leagueid: league.leagueid,
                        start_at_match_id: data.result.matches[data.result.matches.length - 1].match_id - 1,
                    }).url;
                    updateLatestMatchTime(league, url2, mx, cb);
                }
                else {
                    console.log('maxtime' + mx);
                    queries.upsert(db, 'league_info', {
                        league_id: league.leagueid,
                        league_name: league.name,
                        league_desc: league.description,
                        league_url: league.tournament_url,
                        start_time: mx
                    }, {
                        league_id: league.leagueid
                    }, function(err) {
                        return cb();
                    });
                }
            });
        }
    });
}
