var buildLeagueInfo = require('./buildLeagueInfo');
var db = require('../store/db');

buildLeagueInfo(db, function(err)
{
	if (err)
	{
		console.log(err);
	}
});
