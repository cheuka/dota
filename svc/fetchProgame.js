
var fetchProgame = require('../util/fetchProgame');

var db = require('../store/db');


function forEverFetchGame(db, cb) {

	fetchProgame(db, function(err) {
		if (err)
		console.log(err);
	
		// start again
		console.log('start again');
		setImmediate(forEverFetchGame, db, cb);
	});
}

forEverFetchGame(db, function(err) {
	//should never reach here
	console.log('error');
});