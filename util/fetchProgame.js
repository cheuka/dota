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

module.exports = function(db, cb)
{
	console.log('fetch pro games by team');
	async.eachSeries(contants.common_teams, function(team, cb)
	{
		var team_id = team.team_id;
		var url = generateJob("api_teaminfo",
	    {
	        team_id: team_id
	    }).url;

	    getData(url, function(err, data)
	    {
	    	var team = data.result.teams[0];
	    	var league_ids = [];
	    	for (var key in team)
	    	{
	    		if (key.IndexOf('league_id_') != -1)
	    		{
	    			league_ids.push(team[key]);
	    		}
	    	}

	    	async.eachSeries(league_ids, function(league_id, cb)
	    	{
	            // first, check if this league has been fetched for the team
	            db.table('fetch_team_league').select('is_fetched').where('team_id', team_id)
	            .asCallback(function(err, result)
	            {
	            	if (result.is_fetched)
	            	{
	            		return cb();
	            	}

	            	var url = generateJob("api_history",
		            {
		                leagueid: leagueid
		            }).url;

	            	getPage(url, leagueid, team_id, cb);
	            });
	    	}, function(err)
	    	{
	    		cb(err);
	    	});

	    });

	    function getPage(url, leagueid, team_id, cb)
    	{
    		getData(url, function(err, data)
    		{
    			async.eachSeries(data.result.matches, function(match, cb)
	            {
	                console.log('match_id:' + match.match_id);
	                db.table('fetch_team_match').select('is_fetched').where(
	                {
	                	'team_id': team_id,
	                	'match_id': match.match_id
	                }).asCallback(function(err, result)
	                {
	                	if (result.is_fetched)
	                	{
	                		return cb();
	                	}

	                	var job = generateJob("api_details",
		                {
		                    match_id: match.match_id
		                });

		                getData(
		                {
		                    url: job.url,
		                    delay: 1000
		                }, function(err, body)
		                {
		                	if (err)
		                    {
		                        return cb(err);
		                    }
		                    if (body.result)
		                    {
		                        var match = body.result;
		                        match.parse_status = 0;
		                        insertMatch(db, redis, match,
		                        {
		                            type: "api",
		                            attempts: 1,
		                        }, waitParse);
		                    }
		                }

		                function waitParse(err, job)
		                {
		                	if (err)
	                        {
	                            console.error(err.stack || err);
	                            return cb(err);
	                        }

	                        if (job)
	                        {
	                            var poll = setInterval(function()
	                            {
	                                pQueue.getJob(job.jobId).then(function(job)
	                                {
	                                	job.getState().then(function(state)
	                                	{
	                                		console.log("waiting for parse job %s, currently in %s", job2.jobId, state);
	                                        if (state === "completed")
	                                        {
	                                            clearInterval(poll);

	                                            var tm = {
	                                            	team_id: team_id,
	                                            	match_id: match.match_id,
	                                            	is_fetched: 't',
	                                            	is_dem_persisted: 'f'
	                                            };

	                                            queries.upsert(db, 'fetch_team_match', tm, cb);
	                                        }
	                                        else if (state !== "active" && state !== "waiting")
	                                        {
	                                            clearInterval(poll);
	                                            return cb("failed");
	                                        }
	                                	});
	                                });
	                            }, 2000);
	                        }
		                }
	                });

	    		}, function(err)
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
	                	//finish one league, update the database
	                	var tl = {
	                		team_id: team_id,
	                		leagueid: leagueid,
	                		is_fetched: 't'
	                	};
	                	
	                	queries.upsert(db, 'fetch_team_league', tl, cb);
	                }
	    		});
    	};

	});
}