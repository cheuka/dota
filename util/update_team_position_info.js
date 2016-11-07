var constants = require('../constants.js');

var db = require('../store/db');
var queries = require('../store/queries');


constants.log(team_position_info.length);

async.eachSeries(constants.team_position_info, function(tpi, next) {
	queries.upsert(db, 'team_position_info', tpi, {
		team_id: tpi.team_id,
		position_id: tpi.position_id
	},  function(err) {
		console.log(err);
		return next();
	});
}, function(err) {
	console.log("finish");
} );