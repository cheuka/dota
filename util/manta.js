// lordstone: to process manta related stuff

function processMantaResults(e, params)
{
	//console.log('e json: \n' + JSON.stringify(e, null, 2));
	var player_matches = [];
	for(var i = 0; i < e.length; ++i)
	{
		for(key in e[i])
		{
			player_matches.push(processMatch(e[i][key], params));
		}
	}
	return player_matches;
}

function processMatch(e, params)
{
	var player_match = {};

	//console.log(JSON.stringify(e));

	player_match.match_id = e.match_id || -1, // missing player_match id
	player_match.steamid = e.steamid || -1, // missing steamid

	player_match.user_id = params.user_id;
	player_match.dem_index = params.dem_index;
	player_match.replay_blob_key = params.replay_blob_key;
	player_match.is_public = params.is_public;
	player_match.upload_time = params.upload_time;
	
	player_match.player_name = e.player_name || '';
	player_match.hero_id = e.hero_id || -1;
	player_match.hero_name = e.hero_name || '';
	player_match.create_total_damages = e.create_total_damages || 0;
	player_match.create_deadly_damages = e.create_deadly_damages || 0;
	player_match.create_total_stiff_control = e.create_total_stiff_control || 0;
	player_match.create_deadly_stiff_control = e.create_deadly_stiff_control || 0;
	player_match.opponent_hero_deaths = e.opponent_hero_deaths || 0;
	player_match.create_deadly_damages_per_death = e.create_deadly_damages_per_death || 0;
	player_match.create_deadly_stiff_control_per_death =e.create_deadly_stiff_control_per_death || 0 ;
	player_match.rGpm = e.rGpm || 0;
	player_match.unrRpm = e.unrRpm || 0;
	player_match.killHeroGold = e.killHeroGold || 0;
	player_match.deadLoseGold = e.deadLoseGold || 0;
	player_match.fedEnemyGold = e.fedEnemyGold || 0;
	player_match.teamNumber = e.teamNumber || -1;
	player_match.iswin = e.isWin || false;
	player_match.player_id = e.player_id || 0;
	player_match.aloneKilledNum = e.aloneKilledNum || 0;
	player_match.aloneBeCatchedNum  = e.aloneBeCatchedNum || 0;
	player_match.aloneBeKilledNum = e.aloneBeKilledNum || 0;
	player_match.consumeDamage = e.consumeDamage || 0;

	return player_match;
}

module.exports = {
	processMantaResults: processMantaResults
};
