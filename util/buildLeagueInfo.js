var async = require('async');
var utility = require('../util/utility');
var getData = utility.getData;
var generateJob = utility.generateJob;
var db = require('../store/db');
var constants = require('../constants');
var queries = require('../store/queries');

var url = generateJob("api_leagues", {}).url;

module.exports = function(db, cb) {
    console.log("start to fetch league info");
    getData(url, function(err, data) {
        async.forEachLimit(data.result.leagues, 10, function(league, next) {
            queries.upsert(db, 'league_info', {
                league_id: league.leagueid,
                league_name: league.name,
                league_desc: league.description,
                league_url: league.tournament_url
            }, {
                league_id: league.leagueid
            }, function (err) {
                if (err) {
                    console.log(err);
                }
                return next();
            });
        }, function(err) {
            console.log('finished');
            return cb(err);
        });
    });
}
