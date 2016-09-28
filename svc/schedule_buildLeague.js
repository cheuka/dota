var schedule = require('node-schedule');
var buildLeague = require('../util/buildLeague');
var buildLeagueInfo = require('../util/buildLeagueInfo');

var db = require('../store/db');


function scheduleBuildLeague() {

	var rule = new schedule.RecurrenceRule();
	rule.hour = [new schedule.Range(0,20,1), 23];  //every 1 hour, execpt manta process time, expected day after build info
	rule.minute = 30;

	schedule.scheduleJob(rule, function() {
		console.log('start to build leagues')
		buildLeague(db, function(err) {
			if (err)
				console.log(err);
			else
				console.log('finish build league');
		});
	});
}
scheduleBuildLeague();




function scheduleBuildLeagueInfo() {

	var rule = new schedule.RecurrenceRule();
	rule.hour = [new schedule.Range(0,20,1), 23];  //every 1 hour, execpt manta process time
	schedule.scheduleJob(rule, function() {
		buildLeagueInfo(db, function(err) {
			if (err)
				console.log(err);
			else
				console.log('finish build league Info');
		});
	});
}

scheduleBuildLeagueInfo();