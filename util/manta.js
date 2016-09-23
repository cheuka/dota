// lordstone: to process manta related stuff

function processMantaResults(e, params)
{
	var player_matches = [];
	for(player_match in e)
	{
		player_matches.push(processMatch(player_match, params));
	}
	return player_matches;
}

function processMatch(e, params)
{
	var player_match = {};

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
	player_match.create_total_damages = e.create_total_damages || -1;
	player_match.create_deadly_damages = e.create_deadly_damages || -1;
	player_match.create_total_stiff_control = e.create_total_stiff_control || -1;
	player_match.create_deadly_stiff_control = e.create_deadly_stiff_control || -1;
	player_match.opponent_hero_deaths = e.opponent_hero_deaths || -1;
	player_match.create_deadly_damages_per_death = e.create_deadly_damages_per_death || -1;
	player_match.create_deadly_stiff_control_per_death =e.create_deadly_stiff_control_per_death || -1 ;
	player_match.rGpm = e.rGpm || -1;
	player_match.unrRpm = e.unrRpm || -1;
	player_match.killHeroGold = e.killHeroGold || -1;
	player_match.deadLoseGold = e.deadLoseGold || -1;
	player_match.fedEnemyGold = e.fedEnemyGold || -1;
	player_match.teamNumber = e.teamNumber || -1;
	player_match.isWin = e.isWin || false;
	player_match.player_id = e.player_id || -1;
	player_match.aloneKilledNum = e.aloneKilledNum || -1;
	player_match.aloneBeCatchedNum  = e.aloneBeCatchedNum || -1;
	player_match.aloneBeKilledNum = e.aloneBeKilledNum || -1;
	player_match.consumeDamage = e.consumeDamage || -1;

	return player_match;
}

module.exports = {
	processMantaResults: processMantaResults
};
