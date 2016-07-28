/**
 * This is the file for center page
 * lordstone
*/

var express = require('express');
var cheuka_center = express.Router();
var cheuka_session = require('../util/cheukaSession');
var user_db = require('../store/user_db');
// var db = require('../store/db');

module.exports = function(db, redis, cassandra){

cheuka_center.get('/', function(req, res, next)
{
  if(req.session.user){
		var user_id = req.session.user;
		cheuka_session.getMatchData(db, user_db, user_id, function(results)
		{
			//console.log('DEBUG: Rendering list:' + JSON.stringify(results));
			res.render('user/center',
  	 	{
	     	user: req.session.user,
				match_list: results
				//match_json: JSON.stringify(results)
   		});
		});
	}else{
    res.redirect('/');
  }

});
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


return cheuka_center;

};
