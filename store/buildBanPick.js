


//last few bit would represent the position
function getPosition(player_slot)
{
	return Number(play_slot) & 0x07;
}



function buildBanPick(option, cb)
{
	var db = options.db;
    var redis = options.redis;
    var enemy_team_id = options.enemy_team_id;


    db.raw('select * where team_id = ?', [enemy_team_id]).asCallback(function(err, match_ids)
    {
    	if (err)
    	{
    		return cb(err);
    	}

    	if (!match_ids)
    	{
    		return cb(null, []);
    	}

    	// rxu, we use 2D array to represent hero info for pick_order versus position
    	// cell should be like
    	/* 
    		[
    			{
	    			matches: 5
	    			matches_win: 3
	    			hero_id: 3
	    			is_radiant: 0
	    		},

	    		{
					// another hero info
	    		}
	    	]
    	*/
    	// row index represent order 0-4
    	// col index represent play_slot 0-4
    	var heroes_ord_pos = [];

    	// initialize the array
    	for (var ordIdx = 0; ordIdx < 5; ++ordIdx)
    	{
    		var eachOrd = [];
    		for (var posIdx = 0; posIdx < 5; ++posIdx)
    		{
    			eachOrd[posIdx] = [];
    		}
    		heroes_ord_pos[ordIdx] = eachOrd;
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




    			// 2. based on account_id and match_id
    			// query player_match_table
    			// get player slot info, integer type




    			// 3. update the array
				var isHeroExist = false;
				for (var heroIdx = 0; heroIdx < heroes_ord_pos[pbIdx][position].length; ++heroIdx)
				{
					if (heroes_ord_pos[pbIdx][position][heroIdx].hero_id === cnt_heroId)
					{
						// update matches 
						//heroes_ord_pos[pbIdx][position][heroIdx]

						isHeroExist = true;
					}
				}

				if (!isHeroExist)
				{
    				heroes_ord_pos[pbIdx][position].push({
    					matches: 1,
    					matches_win: is_win ? 1 : 0, 
    					hero_id: cnt_heroId
    				});
				}

    		}
    	}


    	// generate require json to frontend

    });




}