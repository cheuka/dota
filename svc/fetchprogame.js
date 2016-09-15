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
var fpgQueue = queue.getQueue('fetchprogame');

fpgQueue.process(1, fetchProMatches);

function fetchProMatches(job, cb)
{
    getData(league_url, function(err, data)
    {
        if (err)
        {
            return cb(err);
        }

        var leagueids = [4664]; // container for leagues plan to request

        var last_league = require('fs').readFileSync('last_league.txt').toString();
        console.log("last_leadgue" + last_league);

/*
        if (last_league === "-1") // fetch from the begining
        {
            leagueids = data.result.leagues;
        }
        else
        {
            var lneed_fetch = false;
            for (var league_idx = 0; league_idx < data.result.leagues.length; ++league_idx)
            {
                if (lneed_fetch) // add remaining not fetched leagues
                {
                    leagueids.push(data.result.leagues[league_idx]);
                }

                if (data.result.leagues[league_idx].leagueid.toString() === last_league)
                {
                    lneed_fetch = true;
                }
            }
*/

        //iterate through leagueids and use getmatchhistory to retrieve matches for each
        async.eachSeries(leagueids, function(leagueid, cb)
        {
            var url = generateJob("api_history",
            {
                leagueid: leagueid
            }).url;
            getPage(url, leagueid, cb);
        }, function(err)
        {
            console.log(err);
            cb(err);
        });
    });

    function getPage(url, leagueid, cb)
    {
        getData(url, function(err, data)
        {
            console.error(leagueid, data.result.total_results, data.result.results_remaining);

            async.eachSeries(data.result.matches, function(match, cb2)
            {
                console.log('match_id:' + match.match_id);
                var detail_job = generateJob("api_details",
                {
                    match_id: match.match_id
                });

                getData(
                {
                    url: detail_job.url,
                    delay: 10000
                }, function(err, body)
                {
                    if (err)
                    {
                        return cb2(err);
                    }
                    if (body.result)
                    {
                        var match = body.result;
                        //match.parse_status = 2; // this is to skip parse
                        match.parse_status = 0;
                        insertMatch(db, redis, match,
                        {
                            type: "api",
                            skipCacheUpdate: true,
                            attempts: 1,
                        }, waitParse);
                    }

                    function waitParse(err, job2)
                    {
                        if (err)
                        {
                            console.error(err.stack || err);
                            return cb2(err);
                        }

                        if (job2)
                        {
                            var poll = setInterval(function()
                            {
                                pQueue.getJob(job2.jobId).then(function(job2)
                                {
                                    job2.getState().then(function(state)
                                    {
                                        console.log("waiting for parse job %s, currently in %s", job2.jobId, state);
                                        if (state === "completed")
                                        {
                                            clearInterval(poll);
                                            return cb2();
                                        }
                                        else if (state !== "active" && state !== "waiting")
                                        {
                                            clearInterval(poll);
                                            return cb2();
                                        }
                                    });
                                });
                            }, 2000);
                        }
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
                    if (!err)
                    {
                        console.log('finish one league ' + leagueid.leagueid);
                        require('fs').writeFile('last_league.txt', leagueid.leagueid.toString(), function(err)
                        {
                            if (err)
                            {
                                console.log("write last league failed!"); 
                            }
                        });
                    }
                    return cb(err);
                }
            });
        });
    }
}
