var async = require('async');

var pickOrderMap = [
{
    '4': 1.0,
    '7': 2.0,
    '12': 3.0,
    '14': 4.0,
    '17': 5.0, // pick order of first ban team
},
{
    '5': 1.0,
    '6': 2.0,
    '13':3.0,
    '15': 4.0,
    '19': 5.0  // pick order of second ban team
}];



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
            console.log('DEBUG: EMPTY LIST in banpick');
            return cb('Empty match list!');
        }
        // console.log('DEBUG db res:' + JSON.stringify(match_ids));
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

        // lordstone: use async.eachseries

        async.eachSeries(match_ids, function(match_i, cb)
        {

        // for (var match_idx = 0; match_idx < match_ids.length; ++match_idx)
            var cur_match_id = match_i.match_id;
            var is_win = match_i.is_winner;

            //for (var pbIdx = 0; pbIdx < 20; ++pbIdx)
            var pbArray = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

            async.eachSeries(pbArray, function(pbIdx, cb)
            {
                // 1. query pick ban table
                // get hero_id, account_id
                var cnt_hero_id;
                var account_id;

                // console.log('DEBUG: cur_match_id:'+cur_match_id + ';pbIdx:' + pbIdx);
                
                // lordstone: NOTE: Here the picks_bans table uses the name 'player_id' instead of 'account_id', whereas the local var here and player_matches both use account_id. Need attention on this!
                
                db
                .table('picks_bans')
                .first('hero_id', 'player_id', 'is_pick', 'team')
                .where({
                    match_id: cur_match_id,
                    ord: pbIdx
                })
                // .raw('select hero_id, account_id, is_pick from picks_bans where match_id = ? and ord = ?', [cur_match_id], [pbIdx])
                .asCallback(function(err, result)
                {
                    // console.log('DEBUG res:' + JSON.stringify(result));
                    if (result && result.is_pick === true)
                    {
                        cnt_hero_id = result.hero_id;
                        account_id = result.player_id;
                        // console.log('DEBUG in!');
                        // lordstone: afterward handling
                        // if not picked or error in find the player
                        if ( !account_id || account_id === 0)
                            return cb();


                        // 2. based on account_id and match_id
                        // query player_match_table
                        // get player slot info, integer type
                        var player_slot;

                        db
                        //.raw('select player_slot from player_matches where match_id = ? and account_id = ?', [cur_match_id], [account_id])
                        .table('player_matches')
                        .first('player_slot')
                        .where({
                            match_id: cur_match_id,
                            account_id: account_id
                        })
                        .asCallback(function(err, result)
                        {
                            // console.log('DEBUG player_match:' + JSON.stringify(result));
                            if (result)
                            {
                                player_slot = result.player_slot;

                                if ( !player_slot)
                                    return cb();
        
                                var team = 0;

                                // player position
                                // 0-4
                                var pos = getPosition(player_slot);

                                // 3. update the array
                                var isHeroExist = false;

                                for (var heroIdx = 0; heroIdx < heroes_pos[pos].length; ++heroIdx)
                                {
                                    if (heroes_pos[pos][heroIdx].hero_id === cnt_hero_id && pickOrderMap[team][pbIdx])
                                    {
                                        console.log("the hero id" + cnt_hero_id + "exists at position　 " + pos);
                                        console.log("before, order is " + heroes_pos[pos][heroIdx].order);
                                        // update matches 
                                        // heroes_pos[position][heroIdx]
                                        isHeroExist = true;
                                        heroes_pos[pos][heroIdx].matches += 1;
                                        heroes_pos[pos][heroIdx].matches_win += is_win ? 1 : 0;
                                        heroes_pos[pos][heroIdx].order += pickOrderMap[team][pbIdx];
                                        console.log("after, order is " + heroes_pos[pos][heroIdx].order);
                                    }
                                }


                                if (!isHeroExist && pickOrderMap[team][pbIdx])
                                {
                                    console.log("the hero id" + cnt_hero_id + "is not existing at position　 " + pos); 
                                    heroes_pos[pos].push({
                                        matches: 1,
                                        matches_win: is_win ? 1 : 0, 
                                        hero_id: cnt_hero_id,
                                        order: pickOrderMap[team][pbIdx]
                                    });
                                }
                                return cb(); // finished processing hero
                            }else{
                                return cb(); // no such player_match exists
                            }// end if result
                            
                        });// end of db cb in player_match

                    }else{
                        // not picked
                        return cb();
                    }// end of if picked

                }); // end of db cb in picks_bans

            }, function(err){
                return cb();                
            }); // end of 2nd level async loop

        }, function(err){
        
            // lordstone: final cb
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
