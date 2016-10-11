
/*
var moment = require('moment');
console.log(moment(new Date()).unix() - 20*24*3600);


var redis = require('../store/redis');

redis.del('worker:' + 'doBuildLeague');
redis.del('worker:' + 'doFetchProgame');
redis.get('worker:' + 'doFetchProgame', function(err, fresh) {
	console.log('fresh ' + fresh);
});

*/
var db = require('../store/db');

db.select('*').from('manta').asCallback(function(err, data) {
require('fs').writeFileSync('manta_result.json', JSON.stringify(data));
});
