var mantaparser = require('./mantaParseDem');
var db = require('../store/db');

mantaparser(db, function(err) {
	if (err) {
		console.log(err);
	}
	else {
		console.log('finished');
	}
	
});
