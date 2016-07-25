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
                var dota = JSON.parse(e.key).game_info.dota;
                container.match_id = dota.match_id;
                container.game_mode = dota.game_mode;
                container.radiant_win = dota.game_winner === 2;
		container.picks_bans = dota.picks_bans; 
		container.player_info = dota.player_info;
		container.game_winner = dota.game_winnner;	
		container.radiant_team_name = dota.radiant_team_tag;
		container.dire_team_name = dota.dire_team_tag;
		container.end_time = dota.end_time;
/*
		console.log('DEBUG: -----start iterate over dota obj');
		for(item in dota){
			console.log('-----item:' + item);
			console.log('-----JSON:' + JSON.stringify(item));
		}
		console.log('DEBUG: ----end iterate over dota obj');
*/
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
