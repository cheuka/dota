var schedule = require('node-schedule');
var buildLeague = require('../util/buildLeague');
var buildLeagueInfo = require('../util/buildLeagueInfo');

var db = require('../store/db');

function forEverBuildLeague(db, cb) {

	buildLeague(db, function(err) {
		if (err) {
			console.error(err);
		}
	
		// start again
		console.log('start build league again');
		setImmediate(forEverBuildLeague, db, cb);
	});
}

forEverBuildLeague(db, function(err) {
	//should never reach here
	console.error('error');
});



// function scheduleBuildLeague() {

// 	var rule = new schedule.RecurrenceRule();
// 	rule.hour = [new schedule.Range(1,19,2), 23];  //every 2 hour, execpt manta process time, expected day after build info

// 	schedule.scheduleJob(rule, function() {
// 		console.log('start to build leagues')
// 		buildLeague(db, function(err) {
// 			if (err)
// 				console.log(err);
// 			else
// 				console.log('finish build league');
// 		});
// 	});
// }
// scheduleBuildLeague();




// function scheduleBuildLeagueInfo() {

// 	var rule = new schedule.RecurrenceRule();
// 	rule.hour = [new schedule.Range(0,18,2), 23];  //every 2 hour, execpt manta process time
// 	schedule.scheduleJob(rule, function() {
// 		buildLeagueInfo(db, function(err) {
// 			if (err)
// 				console.log(err);
// 			else
// 				console.log('finish build league Info');
// 		});
// 	});
// }

// scheduleBuildLeagueInfo();