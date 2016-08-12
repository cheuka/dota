/* lordstone:
 * the file for banpick mockbp api interface
 */

var express = require('express');
var banpick = express.Router();
var fs = require('fs');

var buildBanPick = require('../store/buildBanPick');
var computeBP2Info = buildBanPick.computeBP2Info;

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
			console.log('DEBUG: user data:' + reqdata);
			var user_bp = JSON.parse(reqdata);
			// reply with dummy data:
			var dummy_data = {
				status: 'ok'
			};

			if(user_bp.type === 'combo'){
				dummy_data = {
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
				
				res.send(JSON.stringify(dummy_data));
			}else if (user_bp.type === 'bp2'){

				// For dummy data usage
				/* 
				console.log('DEBUG: display bp2 dummy file contents');
				var json_obj = JSON.parse(fs.readFileSync('./bp2_dummy.json'));
				//console.log('DEBUG: bp2 json:' + JSON.stringify(json_obj));
				
				dummy_data = {
					status: 'ok',
					list: json_obj
				};
				*/

				// @TODO, rxu, temporarily use this
				// next step, we would read team id from local file from its name
				var enemy_team_id = user_bp.enemy_team;

				computeBP2Info(
				{
					db: db,
					redis: redis,
					enemy_team_id: enemy_team_id
				}, function(err, result)
				{
					if (err)
					{
						console.log(err)
						dummy_data = {
							status: "error",
							list: result
						}
					}
					else
					{
						dummy_data = {
							status: 'ok',
							list: result
						}
					}

					res.send(JSON.stringify(dummy_data));
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

