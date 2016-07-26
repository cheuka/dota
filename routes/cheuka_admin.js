/**
 * This is te js file for cheuka's dota 
 * lordstone
**/
var express = require('express');
var config = require('../config');
var constants = require('../constants.js');
var querystring = require('querystring');
var cheuka_admin = express.Router();
var db = require('../store/db');
var redis = require('../store/redis');
var cassandra = config.ENABLE_CASSANDRA_MATCH_STORE_READ ? require('../store/cassandra') : undefined;
var cheuka_session = require('../util/cheukaSession');
var user_db = require('../store/user_db');

module.exports = function(db, redis, cassandra)
{

cheuka_admin.get('/',function(req, res, next)
{
// lordstone
	if(req.session.user && req.session.user == 'admin')
	{
		cheuka_session.findAll(user_db, function(all_users)
		{
			cheuka_session.findAll_inv(user_db, function(all_inv)
			{
				res.render('admin',
				{
					user: req.session.user,
					home: false,
					admin: true,
					entries: all_users,
					invitation_entries: all_inv
				});
			});
		});
	}
	else{
		res.json(
		{
			error: 'You have no access to this page.'
		});
		// res.send('You have no access to this page.');
		//return res.redirect('/');
	}
});

cheuka_admin.get('/new/', function(req, res, next)
{
	//lordstone: new user
	if(req.session.user == 'admin')
	{
		res.render('admin/usermgmt',
		{
			admin: true,
			user: req.session.user,
			mode: 'new'
		});
	}
	else{
		res.redirect('/');
	}
});

cheuka_admin.post('/new/', function(req, res, next)
{
	//lordstone: new user
	if(req.session.user == 'admin')
	{
		var formdata = "";
		req.on('data', function(data){
			formdata += data;
		});
		req.on('end', function(){
			//start validating username and password
			var formitems = querystring.parse(formdata);
			var user_id = formitems['user_id'];
			var password = formitems['password'];
			var invitation_code = formitems['invitation_code'];
			var new_user = {
				user_id: user_id,
				password: password,
				invitation_code: invitation_code
			};
			cheuka_session.newUser(user_db, new_user, function(result)
			{
				if(result=='success'){
					res.redirect('/admin');
				}else{
					res.json({error: 'failed tranaction'});
					//res.redirect('/admin');
				}
			});
		});		
	}
	else{
		res.redirect('/');
	}
});

cheuka_admin.get('/edit/:user_id', function(req, res, next)
{
	//lordstone: edit user
	if(req.session.user == 'admin')
	{
		var user_id = req.params.user_id;
		cheuka_session.findUser(user_db, user_id, function(msg, results)
		{
			if(msg == 'success'){	
				res.render('admin/usermgmt',
				{	
					admin: true,
					user: req.session.user,
					user_id: results.user_id,
					password: results.password,
					invitation_code: results.invitation_code,
					mode: 'edit'
				});
			}else{
				res.json({error:"fetching data failed"});
				// return res.redirect('/admin');
			}
		});
	}
	else{
		res.redirect('/');
	}
});

cheuka_admin.post('/edit/:user_id', function(req, res, next)
{
	//lordstone: edit user processing post
	var formdata = "";
	var old_user_id = req.params.user_id;
	req.on('data', function(data){
		formdata += data;
	});
	req.on('end', function(){
		//start validating username and password
		var formitems = querystring.parse(formdata);
		var new_user_id = formitems['user_id'];
		var password = formitems['password'];
		var invitation_code = formitems['invitation_code'];
		if(req.session.user == 'admin')
		{
			var old_user_id = req.params.user_id;
			var new_user = {
				user_id: new_user_id,
				password: password,
				invitation_code: invitation_code
			};
			console.log("modify:"+new_user.user_id+":"+new_user.password+":"+new_user.invittion_code);
			cheuka_session.editUser(user_db, new_user, old_user_id, function(msg)
			{
				if(msg!='success'){
					res.json({error: 'transaction failed'});
				}else{
					res.redirect('/admin');
				}
			});
		}
		else{
			res.redirect('/');
		}
	});
	//res.send(user_id);
});

cheuka_admin.get('/delete/:user_id', function(req, res, next)
{
	//lordstone: delete user
	var user_id = req.params.user_id;
	if(req.session.user == 'admin')
	{
		cheuka_session.deleteUser(user_db, user_id, function(msg)
		{
			if(msg!='success'){
				res.json({error: 'transaction failed'});
			}else{
				res.redirect('/admin');
			}
		});
	}
	else{
		res.redirect('/');
	}		
}); 

// invitation code

cheuka_admin.get('/new_inv/', function(req, res, next)
{
	//lordstone: new user
	if(req.session.user == 'admin')
	{
		res.render('admin/usermgmt',
		{
			admin: true,
			user: req.session.user,
			mode: 'new_inv'
		});
	}
	else{
		req.redirect('/');
	}
});

cheuka_admin.post('/new_inv/', function(req, res, next)
{
	//lordstone: new user
	if(req.session.user == 'admin')
	{
		var formdata = "";
		req.on('data', function(data){
			formdata += data;
		});
		req.on('end', function(){
			//start validating username and password
			var formitems = querystring.parse(formdata);
			var inv_code = formitems['invitation_code'];
			var max_users = formitems['max_users'];
			var current_users = formitems['current_users'];
			var new_inv = {
				invitation_code: inv_code,
				max_users: max_users,
				current_users: current_users
			};
			cheuka_session.newInv(user_db, new_inv, function(result)
			{
				if(result=='success'){
					res.redirect('/admin');
				}else{
					res.json({error: 'failed tranaction'});
				}
			});
		});		
	}
	else{
		res.redirect('/');
	}
});

cheuka_admin.get('/edit_inv/:inv_code', function(req, res, next)
{
	//lordstone: edit user
	if(req.session.user == 'admin')
	{
		var inv_code = req.params.inv_code;
		cheuka_session.findInv(user_db, inv_code, function(msg, results)
		{
			if(msg == 'success'){	
				res.render('admin/usermgmt',
				{	
					admin: true,
					user: req.session.user,
					invitation_code: results.invitation_code,
					max_users: results.max_users,
					current_users: results.current_users,
					mode: 'edit_inv'
				});
			}else{
				res.json({error: "fetching data failed"});
			}
		});
	}else{
		res.redirect('/');
	}
});

cheuka_admin.post('/edit_inv/:inv_code', function(req, res, next)
{
	//lordstone: edit user processing post
	var formdata = "";
	req.on('data', function(data){
		formdata += data;
	});
	req.on('end', function(){
		//start validating username and password
		var formitems = querystring.parse(formdata);
		var inv_code = formitems['invitation_code'];
		var max_users = formitems['max_users'];
		var current_users = formitems['current_users'];
		if(req.session.user == 'admin')
		{
			var old_inv_code = req.params.inv_code;
			var new_inv = {
				invitation_code: inv_code,
				max_users: max_users,
				current_users: current_users
			};
			cheuka_session.editInv(user_db, new_inv, old_inv_code, function(msg)
			{
				if(msg!='success'){
					res.json({error: 'transaction failed'});
				}else{
					res.redirect('/admin');
				}
			});
		}
		else{
			res.redirect('/');
		}
	});
});

cheuka_admin.get('/delete_inv/:inv_code', function(req, res, next)
{
	//lordstone: delete user
	var inv_code = req.params.inv_code;
	if(req.session.user == 'admin')
	{
		cheuka_session.deleteInv(user_db, inv_code, function(msg)
		{
			if(msg!='success'){
				res.json({error: 'transaction failed'});
			}else{
				res.redirect('/admin');
			}
		});
	}else{
		res.redirect('/');
	}		
}); 

return cheuka_admin;

};

