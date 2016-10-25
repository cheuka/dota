var buildLeagueInfo = require('../util/buildLeagueInfo');

var db = require('../store/db');


function forEverBuildLeagueInfo(db, cb) {

	buildLeagueInfo(db, function(err) {
		if (err) {
			console.error(err);
		}
	
		// start again
		console.log('start build league Info again');
		setImmediate(forEverBuildLeagueInfo, db, cb);
	});
}

forEverBuildLeagueInfo(db, function(err) {
	//should never reach here
	console.error('error');
});

