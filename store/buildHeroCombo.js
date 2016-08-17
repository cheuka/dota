// This is to realize backend teamcombo function

var async = require('async');
var fs = require('fs');

var pickOrderMap =
{
    '4': 1.0,
    '7': 2.0,
    '13': 3.0,
    '15': 4.0,
    '18': 5.0, // pick order of first ban team
    '5': 1.0,
    '6': 2.0,
    '12':3.0,
    '14': 4.0,
    '19': 5.0  // pick order of second ban team
};


//generate required response
function generateHeroComboResult(result)
{	
	var res = [];
	
	for(var i = 0; i < result.length; ++ i){

		var combo_size = result[i].combo_size;
		var combo = result[i].combo;

		for(var j = 0; j < combo.length; ++j){
			
			var matches = combo.count;

			var heroes = [];

			for(var k = 1; k <= combo_size; ++ k){
				heroes.push(combo['h' + k]);
			}

			res.push({
				heroes: heroes,
				matches: matches 	
			});

		} // end for j

	} //end for i
	
    return res;
}


// push data into containers, may require recursive calls
function pushHeroMatch(options, cb){
	/*
		intermediate container elements:
		{
			heroes: [], // hero ids
			matches: []  // all matches with those hero ids
		}
	*/

	var db = options.db;
	// var matches = options.matches;
	var team_id = options.team_id;
	var combo_min = options.combo_min;
	var combo_max = options.combo_max;
	var forgone_heroes = options.forgone_heroes;

/*
	// match ids from matches
	var match_ids = [];

	// array-ize match_ids
	for(var i in matches)
		match_ids.push(matches[i].match_id);
*/
	// the container
	var combo = [];

	// create temp table for query

	// counter array
	var cArray = [];
	for(var i = combo_min; i <= combo_max; ++i)
	{
		cArray.push(i);
	}
	
	console.log('DEBUG:' + JSON.stringify(cArray));

	async.eachSeries(cArray, function(combo_idx, cb)
	{
		// loop over each combo size

		var find_combo = fs.readFileSync('./sql/find_combo_' + combo_idx + '.sql').toString('utf8');
		
		if(!find_combo || find_combo === ''){
			return cb();
		}
		
		// container for this combo size slot
		var combo_slot = {};
		
		// console.log('DEBUG sql query:' + find_combo);
		// console.log('DEBUG: match_ids:' + JSON.stringify(match_ids));
		// console.log('DEBUG: team_id:' + JSON.stringify(team_id));
		// inject sql query

		db
		.raw(find_combo, {
			is_pick: 't',
			// match_ids: '2431090400',
			team_id: team_id,
			limit: 20  // set up query res limit
		})
		.asCallback(function(err, rows){
			if(err){
				console.error('err:' + err);
			}
			
			var result = rows.rows;
			console.log('DEBUG result:' + JSON.stringify(result));

			combo_slot.combo_size = combo_idx;
			combo_slot.combo = result;
			combo.push(combo_slot);
			return cb(err);
		});
	
	}, function(err){
		// final aggregation function
		
		return cb(err, combo);

	});	// end async each series

}


// overall compute function
function computeHeroComboInfo(options, cb)
{
	
	// all infrastructures
    var db = options.db;
    var redis = options.redis;

	// all parameters from user side
	var user_team = options.user_team;// team id
    var enemy_team = options.enemy_team; // team id
	var is_user_radiant = options.is_user_radiant; // bool
	var is_user_first_pick = options.is_user_first_pick; // bool
	var is_picking = options.is_picking;  // bool
	var is_user_turn = options.is_user_turn; // bool
	var list_length = options.list_length;
	var combo_max = options.combo_max;
	var combo_min = options.combo_min;
	var asc = options.asc;
	var fixed_heroes = options.fixed_heroes; 
	// including user/enemy + picked/banned

	// confirm the target team
	var target_team = (is_picking === is_user_turn) ? user_team : enemy_team;  

	// put all forgone heroes into this array
	var forgone_heroes = [];
	for(elem in fixed_heroes){
		for(e in elem){
			forgone_heroes.push(e);
		}
	}	

	/*  
		structure of the final container
		the final containers has the following:
		combo:
		[ 
			{
				heroes: [],  // hero ids
				matches: 3,   //how many matches are like these
				win: 55 // win rate
			},
			...
		]
	*/

	var combos = [];

	// start from all target team's matches
/*
	db
	.table('team_match')
	.select('match_id', 'is_winner', 'version', 'end_time')
	.where({
		team_id: target_team
	})
	.asCallback(function(err, result)
	{

		if(err){
			return cb(err);
		}
		
		// no matching matches
		if(!result || result.length === 0){
			return cb(err, result);
		}
*/

		pushHeroMatch({
			db: db,
			// matches: result,
			team_id: target_team,
			combo_min: combo_min,
			combo_max: combo_max,
			forgone_heroes: forgone_heroes
		}, function(err, result)
		{
			// deal with final results

			// insert any rules in filtering and post-processing query results
						

			return cb(err, result);

		});
/*
	});	
*/			
	

} // end of function

module.exports = {
    computeHeroComboInfo,
}
