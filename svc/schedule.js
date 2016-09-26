var schedule = require('node-schedule');
var fetchProgame = require('../util/fetchProgame');
var buildLeague = require('../util/buildLeague');
var buildLeagueInfo = require('../util/buildLeagueInfo');
var mantaparser = require('../util/mantaParseDem');

var db = require('../store/db');


function scheduleBuildLeague() {
	schedule.scheduleJob('45 * * * *', function() {
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
	schedule.scheduleJob('* 4 * * *', function() {
		buildLeagueInfo(db, function(err) {
			if (err)
				console.log(err);
			else
				console.log('finish build league Info');
		});
	});
}

scheduleBuildLeagueInfo();

function scheduleFetchProgame() {
	schedule.scheduleJob('9 * * * *', function() {
		fetchProgame(db, function(err) {
			if (err)
				console.log(err);
			else
				console.log('finish fetchProgam');
		});
	});
}

scheduleFetchProgame();


function scheduleMantaParse() {
	schedule.scheduleJob('* 2 * * *', function() {
		mantaparser(db, function(err) {
			if (err)
				console.log(err);
			else
				console.log('finish manta parse ');
		});
	});
}

scheduleMantaParse();
