/* lordstone:
   this is to test find combo sql and all the logics
*/

var mytest = require('./store/buildHeroCombo');

var computeHeroComboInfo = mytest.computeHeroComboInfo;
var db = require('./store/db');
var redis = require('./store/redis');


// sample options
var options = {
	db: db,
	redis: redis,
	enemy_team: 2635099,
	user_team: 1520578,
	is_user_radiant: true,
	is_user_first_pick: true,
	is_picking: true,
	is_user_turn: true,
	list_length: 100,
	combo_max: 5,
	combo_min: 5,
	asc: true,
	fixed_heroes: {
		user_picked: [12],
		user_banned: [9],
		enemy_picked: [2],
		enemy_banned:[93]
	}
}

console.time('test computeHeroComboInfo');

computeHeroComboInfo(options, function(err, result){
	
	console.log('Result:' + JSON.stringify(result));
	console.log('\nsize:' + result.length);
	console.timeEnd('test computeHeroComboInfo');

});


