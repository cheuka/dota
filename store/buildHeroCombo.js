// This is to realize backend teamcombo function

var async = require('async');

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
function generateHeroComboResult(raw_data, matches_num)
{	
	var res;
	

    return res;
}

// process forgone heroes
function processForgoneHeroes(container, targets)
{
	for(item in targets){
		container[item] = -1; // mark all forgone heroes with -1
	}
	return container;
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
	var match_ids = options.match_ids;
	var team_id = options.team_id;
	var container = options.container;
	var calls_left = options.call_left;
	var forgone_heroes = options.forgone_heroes;
	
	db
	.table('picks_bans')
	.select('hero_id')
	.whereIn('match_id', match_ids)
	.where({
		team: team_id,
		is_pick: 't'
	})
	.asCallback(function(err, result)
	{
		
		if(err){
			return cb(err);
		}
		if(!result || result.length === 0){
			return cb(err, container);
		}

		var cur_map = {};

		// cur_map = processForgoneHeroes(cur_map, forgone_heroes);
		
		// iterate over all candidate picks_matches
		for(var i in result)
		{	
	
			var cur_hero_id = result[i].hero_id;
			var cur_match_id = result[i].match_id;

			if(isNaN(cur_hero_id))
			{
				// skip the forgone heroes
				continue;
			}
			else if(cur_hero_id in forgone_heroes)
			{
				// not to be inserted
				continue;
			}
			else
			{
				if(!cur_map[cur_hero_id].matches){
					// if a new hero
					cur_map[cur_hero_id].matches = [];
				}
				cur_map[cur_hero_id].matches.push(cur_match_id);
			}
		}
		
		// if this is the last level
		var retval = [];
		for(item in cur_map)
		{
			retval.push({
				heroes: [item],
				matches: item.matches
			});
			if(call_left !== 1){
				
				pushHeroMatch

			}
		}
		return cb(err, retval);
	} // end db callback
}


// overall compute function
function computeHeroComboInfo(options, cb)
{
	
	// all infrastructures
    var db = options.db;
    var redis = options.redis;

	// all parameters from user side
	var user_team: options.user_team;// team id
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
	db
	.table('team_match')
	.select('match_id', 'end_time', 'is_winner')
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

		// a lookup list of single hero
		/*
			kvmap[hero_id] = count(hero_id)
		*/

		pushHeroMatch({
			db: db,
			match_ids: result,
			team_id: target_team,
			container: combos,
			calls_left: combo_max,
			forgone_heroes: forgone_heroes
		}, function(err, result)
		{
			// deal with final results


		};

	});	
			
	

} // end of function

module.exports = {
    computeHeroComboInfo,
}
