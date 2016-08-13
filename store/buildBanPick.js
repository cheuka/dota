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



//A player's slot is8-bit unsigned integer. 
//The first bit represent the player's team, false if Radiant and true if dire. The final three bits represent the player's position in that team, from 0-4.
function getPosition(player_slot)
{
    return Number(player_slot) & 0x07;
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
            heroes: []
        };

        var heroes = [];
        for (var num = 0; num < heroes_pos[pos].length; ++num)
        {
            var win_ratio = 100 * heroes_pos[pos][num].matches_win / heroes_pos[pos][num].matches;
            heroes.push({
                hero_id: heroes_pos[pos][num].hero_id,
                matches: heroes_pos[pos][num].matches,
                win: win_ratio.toFixed(0),
                order: heroes_pos[pos][num].order
            });
        }
        
        player_slot.heroes = heroes;
        
        res.player_slots.push(player_slot);
    }

    return res;
}


function computeBP2Info(options, cb)
{

    var db = options.db;
    var redis = options.redis;
    var enemy_team_id = options.enemy_team_id;
    // console.log('DEBUG:' + enemy_team_id);


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

    // each match will be like 
    //  {
    //       match_id: xx
    //       xpg: [xplusgold], will get the postion based on this
    //       hero_id: []
    //       is_win: true
    //       pos: [0-4]
    //  } 
    //

    var heroes_pos = [];
    var matches = [];

    // initialize the array
    for (var pos = 0; pos < 5; ++pos)
    {
        var eachPos = [];
        heroes_pos[pos] = eachPos;
    }

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

        // lordstone: use async.eachseries
        async.eachSeries(match_ids, function(match_i, cb)
        {
            var cur_match_id = match_i.match_id;
            var is_win = match_i.is_winner;

            var cur_match = {
                match_id: cur_match_id,
                is_win: is_win,
                xpg: [],
                hero_id: [],
                position: [0,1,2,3,4],
                picks: [1,2,3,4,5]
            };

            db
            .table('player_matches')
            .select('xp_per_min', 'gold_per_min', 'hero_id')
            .where({
                match_id: cur_match_id
            })
            .asCallback(function(err, playerinfos)
            {
                if (!playerinfos)
                    return cb();

                for (var p = 0; p < playerinfos.length; ++p)
                {
                    cur_match.xpg.push(Number(playerinfos[p].xp_per_min) + Number(playerinfos[p].gold_per_min));
                    cur_match.hero_id.push(playerinfos[p].hero_id);
                }

                function cmp(a, b)
                {
                    return cur_match.xpg[b] - cur_match.xpg[a];
                }
                cur_match.position.sort(cmp);

                db
                .table('picks_bans')
                .select('ord', 'hero_id')
                .where({
                    match_id: cur_match_id
                })
                .asCallback(function(err, ords)
                {
                    if (!ords)
                        return cb();

                    for (var p = 0; p < playerinfos.length; ++p)
                    {
                        for (var o = 0; o < ords.length; ++o)
                        {
                            if (playerinfos[p].hero_id === ords[o].hero_id)
                            {
                                cur_match.picks[p] = pickOrderMap[ords[o].ord];
                            }
                        }
                    }

                    matches.push(cur_match);
                    return cb();
                });
            });

        }, function(err){
            
            for (var match_idx = 0; match_idx < matches.length; ++match_idx)
            {
                var cur_match = matches[match_idx];
                for (var p = 0; p < 5; ++p)
                {
                    var is_hero_exist = false;
                    var pos = cur_match.position[p];

                    //@TODO,  rxu, find picks order null, need to figure out why
		    if (!cur_match.picks[p] && cur_match.picks[p] !== 0)
			continue;

                    for (var hero_idx = 0; hero_idx < heroes_pos[pos].length; ++hero_idx)
                    {
                        if (heroes_pos[pos][hero_idx].hero_id === cur_match.hero_id[p])
                        {
                            is_hero_exist = true;
				

                            heroes_pos[pos][hero_idx].matches += 1;
                            heroes_pos[pos][hero_idx].matches_win += cur_match.is_win ? 1 : 0;
                            heroes_pos[pos][hero_idx].order += cur_match.picks[p];
                        }
                    }

                    if (!is_hero_exist)
                    {
                        heroes_pos[pos].push({
                                        matches: 1,
                                        matches_win: cur_match.is_win ? 1 : 0, 
                                        hero_id: cur_match.hero_id[p],
                                        order: cur_match.picks[p]
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
            // console.log('DEBUG: response:' + JSON.stringify(response));
            return cb(err, response);

        });  // end for first async eachSeries

    }); //  the outter db query in team_match

} // end of function

module.exports = {
    computeBP2Info,
}
