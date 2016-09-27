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
    getData(url, function(err, data) {
        async.forEachLimit(data.result.leagues, 10, function(league, next) {

        	var url2 = generateJob("api_history", {
                leagueid: league.leagueid
            }).url;

            getData(url2, function(err, data) {
            	if (err) {
            		return next();
            	}

            	var st = [];
            	data.result.matches.forEach(function(match) {
            		st.push(match.start_time);
            	});

            	/*
            	var st_median;
            	if (st.length > 0) 
            		st_median = Math.round(median(st));
            	else
            		st_median = 0;
            	*/

            	var st_max = 0;
            	for (var st_i in st) {
            		st_max = Math.max(st_max, st[st_i]);
            	}
            	console.log('st_max ' + st_max);

            	queries.upsert(db, 'league_info', {
	                league_id: league.leagueid,
	                league_name: league.name,
	                league_desc: league.description,
	                league_url: league.tournament_url,
	                start_time: st_max
	            }, {
	                league_id: league.leagueid
	            }, function (err) {
	                if (err) {
	                    console.log(err);
	                }
	                return next();
	            });
            });
        }, function(err) {
            console.log('finished');
            return cb(err);
        });
    });
}
