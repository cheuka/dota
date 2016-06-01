/**
 * A processor to extract basic match stats from the replay file.
 * This is used for uploaded match parses since we can't get basic match data from the API.
 **/
function processUploadProps(entries, meta)
{
    var container = {
        player_map:
        {}
    };
    container.duration = meta.game_end - meta.game_zero;
    for (var i = 0; i < entries.length; i++)
    {
        var e = entries[i];
        switch (e.type)
        {
            case 'epilogue':
                var dota = JSON.parse(e.key).gameInfo_.dota_;
                container.match_id = dota.matchId_;
                container.game_mode = dota.gameMode_;
                container.radiant_win = dota.gameWinner_ === 2;
		var bp_arr = [];
		for (var item in dota.picksBans_)
		{
			bp_arr.push({'hero_id': dota.picksBans_[item].heroId_, 'is_pick':dota.picksBans_[item].isPick_, 'team': dota.picksBans_[item].team_});
		}
		container.picks_bans = JSON.parse(JSON.stringify(bp_arr)); 
                //require('fs').writeFileSync('./outputEpilogue.json', JSON.stringify(JSON.parse(e.key)));
            case 'interval':
                if (!container.player_map[e.player_slot])
                {
                    container.player_map[e.player_slot] = {};
                }
                container.player_map[e.player_slot].hero_id = e.hero_id;
                container.player_map[e.player_slot].level = e.level;
                container.player_map[e.player_slot].kills = e.kills;
                container.player_map[e.player_slot].deaths = e.deaths;
                container.player_map[e.player_slot].assists = e.assists;
                container.player_map[e.player_slot].denies = e.denies;
                container.player_map[e.player_slot].last_hits = e.lh;
                container.player_map[e.player_slot].gold = e.gold;
                container.player_map[e.player_slot].xp = e.xp;
                break;
            default:
                break;
        }
    }
    return container;
}
module.exports = processUploadProps;
