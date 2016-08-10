var utility = require('../util/utility');
var generateJob = utility.generateJob;
var async = require('async');
var getData = utility.getData;
var db = require('../store/db');
var redis = require('../store/redis');
var cassandra = require('../store/cassandra');
var queries = require('../store/queries');
var insertMatch = queries.insertMatch;
var league_url = generateJob("api_leagues", {}).url;

var queue = require('../store/queue');
var pQueue = queue.getQueue('parse');

fetchProMatches(function(err)
{
    if (err)
    {
        console.log(err);
    }
});


function fetchProMatches(cb)
{
    getData(league_url, function(err, data)
    {
        if (err)
        {
            cb(err);
        }

        var league_ids = data.result.leagues.map(function(l)
        {
            return l.leagueid;
        });

        //iterate through leagueids and use getmatchhistory to retrieve matches for each
        async.eachSeries(league_ids, function(leagueid, cb)
        {
            var url = generateJob("api_history",
            {
                leagueid: leagueid
            }).url;
            getPage(url, leagueid, cb);
        }, function(err)
        {
            cb(err);
        });
    });

    function getPage(url, leagueid, cb)
    {
        // todo fetch from match seq num set in redis

        getData(url, function(err, data)
        {
            console.error(leagueid, data.result.total_results, data.result.results_remaining);

            async.eachSeries(data.result.matches, function(match, cb2)
            {
                console.log('match_id:' + match.match_id);
                var job = generateJob("api_details",
                {
                    match_id: match.match_id
                });

                getData(
                {
                    url: job.url,
                    delay: 10000
                }, function(err, body)
                {
                    if (err)
                    {
                        cb2(err);
                    }
                    if (body.result)
                    {
                        var match = body.result;
			match.parse_status = 0;
                        insertMatch(db, redis, match,
                        {
                            type: "api",
                            attempts: 1,
                        }, function(err)
                        {
                            if (err)
                            {
                                console.log(err);
                            }
				console.log("finish insert match");
                            cb2(err);
                        });
                        //redis.set('last_pro_match', match.match_seq_num);
                    }
                });
            }, function (err)
            {
                if (data.result.results_remaining)
                {
                    var url2 = generateJob("api_history",
                    {
                        leagueid: leagueid,
                        start_at_match_id: data.result.matches[data.result.matches.length - 1].match_id - 1,
                    }).url;
                    getPage(url2, leagueid, cb);
                }
                else
                {
                    cb(err);
                }
            });
        });
    }
}

module.exports = {
   fetchProMatches,
};

