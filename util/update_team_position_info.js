var async = require('async');
var constants = require('../constants.js');


var db = require('../store/db');
var queries = require('../store/queries');

var teams = constants.team_position_info;

console.log(teams.team_position_info.length);


async.eachSeries(teams.team_position_info, function(tpi, next) {
	console.log(tpi);
	queries.upsert(db, 'team_position_info', tpi, {
		team_id: tpi.team_id,
		position_id: tpi.position_id,
		account_id: tpi.account_id
	},  function(err) {
		console.log(err);
		return next();
	});
}, function(err) {
	console.log("finish");
} );
