/*
 * This handles all APIs for dem storage
 * lordstone
 */

var express = require('express');
var config = require('../config');
var storedem = express.Router();
var find_all_uploads = require('../util/cheukaSession').findAllUploads;

module.exports = function(db, redis)
{
	storedem.get('/list', function(req, res, next)
	{
		if(req.session.user){
			var user_id = req.session.user;
			find_all_uploads(db, user_id, function(err, result)
			{
				if(err)
				{
					res.send('err:' + err);
				}else{
					res.json(result);
				}
			});
		}else{
			res.redirect('/');
		}
	});



	return storedem;
};
