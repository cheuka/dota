
var pickOrderMap = {
	'4': 1,
	'7': 2,
	'12': 3,
	'14': 4,
	'17': 5, // pick order of first ban team
	'5': 1,
	'6': 2,
	'13':3,
	'15': 4,
	'19': 5  // pick order of second ban team
};


//A player's slot is8-bit unsigned integer. 
//The first bit represent the player's team, false if Radiant and true if dire. The final three bits represent the player's position in that team, from 0-4.
function getPosition(player_slot)
{
	return Number(play_slot) & 0x07;
}

//generate required response
function generateBP2Result(heroes_pos)
{
	var res = {
		type: "BP2",
		player_slots: []
	};


	for (var pos = 0; pos < heroes_pos.length; ++pos)
	{
		var player_slot = {
			player_slot: pos,
			orders: []
		};

		for (var num = 0; num < heroes_pos[pos].length; ++num)
		{
		    var win_ratio = 100 * heroes_pos[pos][num].matches_win / heroes_pos[pos][num].matches;
			var heroes = [{
				hero_id: heroes_pos[pos][num].hero_id,
				matches: heroes_pos[pos][num].matches,
				win: win_ratio.toFixed(0)
			}];
			

			player_slot.orders.push({
				order: heroes_pos[pos][num].order,
				heroes: heroes
			});
		}
		
		res.player_slots.push(player_slot);
	}

	return res;
}


function computeBP2Info(options, cb)
{

	var db = options.db;
    var redis = options.redis;
    var enemy_team_id = options.enemy_team_id;
	
    db
	// .raw('select * where team_id = ?', [enemy_team_id])
	.table('team_match')
	.select()
	.where('team_id', enemy_team_id)
	.asCallback(function(err, match_ids)
	{
    	if (err)
    	{
    		return cb(err);
    	}

    	if (!match_ids)
    	{
    		return cb('Empty match list!');
    	}

    	// rxu, we use a array to represent hero info, index is position
    	// cell should be like
    	/* 
    		[
    			{
	    			matches: 5
	    			matches_win: 3
	    			hero_id: 3
	    			is_radiant: 0
	    			order: 2, [0, 4]
	    		},

	    		{
					// other hero info
	    		}

	    		.....
	    	]
    	*/


    	var heroes_pos = [];

    	// initialize the array
    	for (var pos = 0; pos < 5; ++pos)
    	{
    		var eachPos = [];
    		heroes_pos[pos] = eachPos;
    	}


    	for (var match_idx = 0; match_idx < match_ids.length; ++match_idx)
    	{
    		var cur_match_id = match_ids[match_idx].match_id;
    		var is_win = match_idx[match_idx].is_winner;


    		
    		for (var pbIdx = 0; pbIdx < 20; ++pbIdx)
    		{
    			var cnt_heroId;
    			// 1. query pick ban table
    			// get hero_id, account_id
    			var hero_id;
    			var account_id;
    			db
				.table('picks_bans')
				.select('hero_id', 'account_id', 'is_pick')
				.where({
					match_id: cur_match_id,
					ord: pbIdx
				})
				// .raw('select hero_id, account_id, is_pick from picks_bans where match_id = ? and ord = ?', [cur_match_id], [pbIdx])
				.asCallback(function(err, result)
    			{
    				if (result && result.is_pick)
    				{
    					cnt_heroId = result.hero_id;
    					account_id = result.account_id;
    				}
    			});

    			// if not picked or error in find the player
    			if ( !account_id )
    				continue;

    			// 2. based on account_id and match_id
    			// query player_match_table
    			// get player slot info, integer type
    			var player_slot;
    			db
				//.raw('select player_slot from player_matches where match_id = ? and account_id = ?', [cur_match_id], [account_id])
				.table('player_matches')
				.select('player_slot')
				.where({
					match_id: cur_match_id,
					account_id: account_id
				})
				.asCallback(function(err, result)
    			{
    				if (result)
    				{
    					player_slot = result.player_slot;
    				}
    			});

    			if ( !player_slot)
    				continue;

    			// player position
    			// 0-4
    			var pos = getPosition(player_slot);

    			// 3. update the array
				var isHeroExist = false;
				for (var heroIdx = 0; heroIdx < heroes_pos[pos].length; ++heroIdx)
				{
					if (heroes_pos[pos][heroIdx].hero_id === cnt_heroId)
					{
						// update matches 
						// heroes_pos[position][heroIdx]
						isHeroExist = true;
						heroes_pos[pos][heroIdx].matches += 1;
						heroes_pos[pos][heroIdx].matches_win += is_win ? 1 : 0;
						heroes_pos[pos][heroIdx].order += pickOrderMap[pbIdx];
					}
				}

				if (!isHeroExist)
				{
    				heroes_pos[pos].push({
    					matches: 1,
    					matches_win: is_win ? 1 : 0, 
    					hero_id: cnt_heroId,
    					order: pickOrderMap[pbIdx]
    				});
				}
    		}
    	}

    	//calculate the average order
    	for (var pos = 0; pos < heroes_pos.length; ++pos)
    	{
    		for (var num = 0; num < heroes_pos[pos].length; ++num)
    		{
    			heroes_pos[pos][num].order = heroes_pos[pos][num].order / heroes_pos[pos][num].matches;
    		}
    	}


    	// generate required json to frontend
    	var response = generateBP2Result(heroes_pos);
		console.log('DEBUG: response:' + JSON.stringify(response));
    	cb(err, response);
    });

}

module.exports = {
	computeBP2Info,
}
