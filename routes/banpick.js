/* lordstone:
 * the file for banpick mockbp api interface
 */

var express = require('express');
var banpick = express.Router();
var fs = require('fs');

var buildBanPick = require('../store/buildBanPick');
var computeBP2Info = buildBanPick.computeBP2Info;

var buildHeroCombo = require('../store/buildHeroCombo');
var computeHeroComboInfo = buildHeroCombo.computeHeroComboInfo;

const CONST_MATCH_ODDS = 0;
const CONST_WINNING_RATES = 1;


module.exports = function(db, redis)
{

	banpick.post('/', function(req, res, cb)
	{
		// res.send('Sample banpick api message');
		// console.log('DEBUG: post');

        var reqdata = "";

        req.on('data', function(data){
            reqdata += data;
        });

        req.on('end', function(){
			// console.log('DEBUG: user data:' + reqdata);
			var user_bp = JSON.parse(reqdata);
			// reply with dummy data:
			var return_data = {
				status: 'ok'
			};

			if(user_bp.type === 'combo'){

				/*
				return_data = {
					status: 'ok',
					list:
					[
						{
							heroes: [12,34],
							matching_odds: 0.75,
							winning_rate: 0.61
						},
						{
							heroes: [14, 66],
							matching_odds: 0.72,
							winning_rate: 0.55
						},
						{
							heroes: [22, 55, 77],
							matching_odds: 0.71,
							winning_rate: 0.48
						}
					]
				};
				*/

				console.log('DEBUG: user combo req data:' + reqdata);

				// calling compute function
		
		
				console.time('computeHeroComboInfo');

				computeHeroComboInfo(
				{
					db: db,
					redis: redis,
					user_team: user_bp.user_team,
					enemy_team: user_bp.enemy_team,
					is_user_radiant: user_bp.is_user_radiant,
					is_user_first_pick: user_bp.is_user_first_pick,
					is_picking: user_bp.is_picking,
					is_user_turn: user_bp.is_user_turn,
					fixed_heroes: user_bp.fixed_heroes,
					list_length: user_bp.options.list_length,
					combo_max: user_bp.options.combo_max,
					combo_min: user_bp.options.combo_min,
					asc: user_bp.options.asc
					//options: user_bp.options
				}, function(err, result)
				{
					
					console.timeEnd('computeHeroComboInfo');

					if(err){
						console.error('Error:' + err);
						return_data = {
							status: 'error',
							list: err
						};
					}
					else
					{
						return_data = {
							status: 'ok',
							list: result
						};
					}
					res.send(JSON.stringify(return_data));

				}); // end of computeHeroComboInfo


			}else if (user_bp.type === 'bp2'){

				// For dummy data usage
				/* 
				console.log('DEBUG: display bp2 dummy file contents');
				var json_obj = JSON.parse(fs.readFileSync('./bp2_dummy.json'));
				//console.log('DEBUG: bp2 json:' + JSON.stringify(json_obj));
				
				return_data = {
					status: 'ok',
					list: json_obj
				};
				*/

				// @TODO, rxu, temporarily use this
				// next step, we would read team id from local file from its name
				var enemy_team_id = Number(user_bp.enemy_team);

			    if(isNaN(enemy_team_id)){
			        console.error('Team id is NaN. Aborting...');
			        res.json({
						status: 'err: team id NaN'
					});
					return;
			    }

				computeBP2Info(
				{
					db: db,
					redis: redis,
					enemy_team_id: enemy_team_id
				}, function(err, result)
				{
					if (err)
					{
						console.log(err);
						return_data = {
							status: "error",
							list: result
						};
					}
					else
					{
						return_data = {
							status: 'ok',
							list: result
						};
					}
					// console.log('DEBUG:' + JSON.stringify(return_data));
					res.send(JSON.stringify(return_data));
				});
			}
		});
	});


	banpick.get('/', function(req, res, cb)
	{
		res.send('Sample banpick api message for get');
	});

	return banpick;		
};

