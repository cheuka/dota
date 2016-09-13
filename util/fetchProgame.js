var async = require('async');
var utility = require('../util/utility');
var getData = utility.getData;
var generateJob = utility.generateJob;
var db = require('../store/db');
var constants = require('../constants');

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
	    		var url = generateJob("api_history",
	            {
	                leagueid: leagueid
	            }).url;

	            getPage(url, leagueid, team_id, cb);
	    	}, function(err)
	    	{
	    		cb(err);
	    	});

	    });

	    function getPage(url, leagueid, team_id, cb)
    	{
    		getData(url, function(err, data)
    		{

    		});
    	};

	});
}