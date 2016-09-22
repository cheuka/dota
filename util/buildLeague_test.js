var buildLeague = require('./buildLeague');
var db = require('../store/db');

buildLeague(db, function(err)
{
	if (err)
	{
		console.log(err);
	}
});
