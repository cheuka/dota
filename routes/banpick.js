/* lordstone:
 * the file for banpick mockbp api interface
 */

var express = require('express');
var banpick = express.Router();


module.exports = function(db, redis)
{

	banpick.post('/', function(req, res, cb)
	{
		res.send('Sample banpick api message');


	});

	return banpick;		
};
