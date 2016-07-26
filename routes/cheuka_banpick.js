/*
 * This handles all banpick routing
 * lordstone
 */

var express = require('express');
var config = require('../config');
var constants = require('../constants.js');
var cheuka_banpick = express.Router();
var user_db = require('../store/user_db');
var cheuka_session = require('../util/cheukaSession');


module.exports = function(db, redis, cassandra)
{
	cheuka_banpick.get('/', function(req, res, next)
	{
		if(req.session.user){
			res.render('banpick/banpick',
			{
				user: req.session.user,
			});
		}else{
			res.redirect('/');
		}

	});

	return cheuka_banpick;

};
