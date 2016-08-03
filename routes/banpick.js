/* lordstone:
 * the file for banpick mockbp api interface
 */

var express = require('express');
var banpick = express.Router();

const CONST_MATCH_ODDS = 0;
const CONST_WINNING_RATES = 1;


module.exports = function(db, redis)
{

	banpick.post('/', function(req, res, cb)
	{
		// res.send('Sample banpick api message');
		console.log('DEBUG: post');
        var reqdata = "";
        req.on('data', function(data){
            reqdata += data;
        });
        req.on('end', function(){
			console.log('DEBUG: user data:' + reqdata);
			var user_bp = JSON.parse(reqdata);
			// reply with dummy data:
			var dummy_data = {
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

		});
	});


	banpick.get('/', function(req, res, cb)
	{
		res.send('Sample banpick api message for get');
	});

	return banpick;		
};
