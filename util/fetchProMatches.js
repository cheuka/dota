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

fetchProMatches(function(err){});


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
		getData(url, function(err, data)
		{
			//console.error(leagueid, data.result.total_results, data.result.results_remaining);
			async.eachSeries(data.result.matches, function(match)
			{
				console.log(match.match_id);
				//rxu, iterate all matches
				//then insert them into db
				var delay = 10000;
				var job = generateJob("api_details",
				{
					match_id: match.match_id
				});

				getData(
				{
					url: job.url,
					delay: delay
				}, function(err, body)
				{
					if (err)
					{
						cb(err);
					}
					if (body.result)
					{
						var match = body.result;

						insertMatch(db, redis, match,
						{
							skipCounts: true,
							skipAbilityUpgrades: true,
							skipParse: true,
							attempts: 1,
						}, function(err)
						{
							console.error(err);
						});
					}
				});
			});
			
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
	}
}

module.exports = {
fetchProMatches,
};

