/*
 * This is the file for reviews page
 * lordstone
 */

var express = require('express');
var reviews = express.Router();
var constants = require('../constants.js');
var matchPages = constants.match_pages;
var checkMatchId = require('../util/cheukaSession').checkMatchId;

module.exports = function(db, redis, cassandra)
{

	reviews.get('/', function(req, res, next)
	{
		if(req.session.user)
		{
			// lordstone: to display the recent match list
			cheuka_session.getMatchData(db, user_id, function(results)
			{
				res.render('reviews/center',
				{
					user: req.session.user,
					match_list: results
				});
			});
		}
		else
		{
			res.redirect('/');
		}

	});

	reviews.get('/match/:match_id/:info?', function(req, res, cb)
	{
		if(req.session.user)
		{
			// lordstone: to display single match
			buildMatch(
			{
				db: db,
				redis: redis,
				cassandra: cassandra,
				match_id: req.params.match_id
			}, function(err, match)
			{
				if(err)
				{
					return cb(err);
				}
				if (!match)
				{
					return cb();
				}
				var info = req.params.info ||  "index";
				
				checkMatchId(db, req.session.user, match.match_id, function(result)
				{
					if(result === false)
					{
						res.send('You have no access to this match.');
					}
					else
					{
						res.render('reviews/reviews_' + info,
						{
							user: req.session.user,
							match: match,
							title: "Match " + match.match_id + " - DOTAA "
						});
					}
				});
			});

		}
		else
		{
			res.redirect('/');
		}



	return reviews;

};
