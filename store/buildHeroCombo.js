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
			
			var matches = combo[j].count;
			var wins = combo[j].wins;
			var heroes = [];
			
			if(matches === 0)
				break;

			for(var k = 1; k <= combo_size; ++ k){
				heroes.push(combo[j]['h' + k]);
			}

			res.push({
				heroes: heroes,
				matches: matches,
				wins: wins	
			});

		} // end for j

	} //end for i
	
    return res;
}


// process the formed results with customized rules
function processResult(options, result){
	
	var final_result = [];
	
	var list_length = options.list_length;
	var combo_min = options,combo_min;
	var combo_max = options.combo_max;
	var fixed_heroes = options.fixed_heroes;
	
	for(var i = 0; i < result.length; i ++)
	{
		var combo = result[i];
		var combo_size = combo.heroes.length;
		var matches = combo.matches;
		var wins = combo.wins;
		
		// calculate score of each combo
		// from size: 2: 1x, 3: 1.5x, 4: 2x, 5: 2.5x

		var multiple_size_map = {
			'2': 1,
			'3': 1.5,
			'4': 2,
			'5': 2.5
		};		

		var multiple_size = multiple_size_map[combo_size];

		// from matches: (base pts)
		// from wins: none
		
		var score = multiple_size * matches;

		result[i]['score'] = score;

	} // end for i

	// with the score, sort the array of result.

	var descSortFunc = function(a, b){
		return b.score - a.score;
	};
	
	result.sort(descSortFunc);

	final_result = result.slice(0, Math.min(list_length, result.length));
	
	return final_result;

}



// push data into containers, may require recursive calls
function findPicksBansInfo(options, cb){

	var db = options.db;
	// var matches = options.matches;
	var team_id = options.team_id;
	var combo_min = options.combo_min || 2;
	var combo_max = options.combo_max || 5;
	var forgone_heroes = options.forgone_heroes;
	var list_length = options.list_length;

	// the container
	var combo = [];

	// counter array
	var cArray = [];
	for(var i = combo_min; i <= combo_max; ++i)
	{
		if(i < 2 || i > 5)
			break;
		cArray.push(i);
	}
	
	// console.log('DEBUG:' + JSON.stringify(cArray));

	async.eachSeries(cArray, function(combo_idx, cb)
	{
		// loop over each combo size

		if(combo_idx <= 5 && combo_idx >= 2){

			// for 2-5 combo size, use descartes product method
			var find_combo = fs.readFileSync('./sql/find_combo_' + combo_idx + '.sql').toString('utf8');
		
			if(!find_combo || find_combo === ''){
				return cb();
			}
		
			// container for this combo size slot
			var combo_slot = {};
		
			// use 1.25 as the allowance for each query
			const QUERY_ALLOWANCE = 1.25;

			// use 5 as the minimum number for query
			const MIN_QUERY_SIZE = 5;

			// define the req limit for each round
			var query_limit = list_length / (combo_max - combo_min + 1);
			var query_limit = Math.round(query_limit * QUERY_ALLOWANCE);

			// console.log('DEBUG: match_ids:' + JSON.stringify(match_ids));
			// var mydate = new Date();			
			// console.log('Table Name:' + mydate.getTime());
			// inject sql query
			db
			.raw(find_combo, {
				is_pick: 't',
				// temp_table: ('temp_table_' + mydate.getTime()),
				team_id: team_id,
				limit: Math.max(MIN_QUERY_SIZE, query_limit)  // set up query res limit
			})
			.asCallback(function(err, rows){
				if(err){
					console.error('err:' + err);
				}
			
				var result = rows.rows;
				// console.log('DEBUG result:' + JSON.stringify(result));

				combo_slot.combo_size = combo_idx;
				combo_slot.combo = result;
				combo.push(combo_slot);
				return cb(err);
			});
		}	
		else
		{
			// if combo size is illegal	
			return cb();
		}

	}, function(err){

		// final aggregation function
		return cb(err, generateHeroComboResult(combo));

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

	// var combos = [];

	findPicksBansInfo({
		db: db,
		team_id: target_team,
		combo_min: combo_min,
		combo_max: combo_max,
		forgone_heroes: forgone_heroes,
		list_length: list_length
	}, function(err, result)
	{
		// deal with final results
		// insert any rules in filtering and post-processing query results
		
		var final_result = processResult({
			combo_min: combo_min,
			combo_max: combo_max,
			fixed_heroes: fixed_heroes,
			list_length: list_length
		}, result);	
		
		return cb(err, final_result);

	});

} // end of function

module.exports = {
    computeHeroComboInfo,
}
