var schedule = require('node-schedule');
var mantaparser = require('../util/mantaParseDem');
var db = require('../store/db');

var rule = new schedule.RecurrenceRule();
rule.hour = 21;  // beijing time 5am
rule.minute = 30;

var j = schedule.scheduleJob(rule, function() {
        console.log('start manta parse match');
	mantaparser(db, function(err) {
		if (err)
			console.log(err);
		else
			console.log('finish manta parse ');
	});
});

