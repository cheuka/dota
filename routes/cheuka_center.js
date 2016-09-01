/*
 * This is the file for center page
 * lordstone
*/

var express = require('express');
var async = require('async');

var cheuka_center = express.Router();
var cheuka_session = require('../util/cheukaSession');


module.exports = function(db, redis, cassandra){

	cheuka_center.get('/', function(req, res, next)
	{
		if(req.session.user){

			var user_id = req.session.user;
			var match_list = [];
			var waiting_list = [];

			async.series(
			{
				"sql": getSqlList,
				"wl": getWaitingList
			}, exit);

			function getSqlList(cb)
			{
				cheuka_session.getMatchData(db, user_id, 
					function(result){
						match_list = result;
						return cb();
					}
				);
			}

			function getWaitingList(cb)
			{
				redis.get('waiting_list:'+user_id, function(err, result)
				{
					console.log('DEBUG waiting list:' + result);
					waiting_list = result;
					return cb();
				}
			}

			function exit(err)
			{
				res.render('user/center',
				{
					user: user_id,
					match_list: results,
					waiting_list: waiting_list
				});		
			}

		}else{
			res.redirect('/');
		}

	});

/*
cheuka_center.get('/delete/:match_id', function(req, res)
{
	if(req.session.user){
		var user_id = req.session.user;
		var match_id = req.params.match_id;
		console.log('DEBUG: delete match' + match_id);
		cheuka_session.deleteUserMatch(db, user_db, user_id, match_id, function(results)
		{
			res.redirect('/center');
		});
	}else{
		res.redirect('/');
	}

});
*/

	return cheuka_center;

};
