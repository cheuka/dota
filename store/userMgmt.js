// var async = require('async');
var config = require('../config');
var async = require('async');
var util = require('../util/utility');

function logUser(db, user_id, password, cb){
	console.log("logging user");
	db.first().from('user_list').where({
		user_id: user_id,
		password: password
	}).asCallback(function(err, res){
		if(err){
			return cb('failed', err);
		}
		if(!res){
			return cb('failed', 'unknown error');
		}
		console.log('log in successfully. user_id:' + user_id);
			return cb('success', 
			{
				user_id: user_id
			});
	});	
}

function findUser(db, user_id, cb){
	console.log("finding user");
	db.first().from('user_list').where('user_id', '=', user_id).asCallback(function(err, result){
		if(err){
			return cb(err);
		}
		var t = null;
		t = result;
		return cb(err, t);
	});	
}

function findAll(db, cb){
	console.log("listing all users");
	db.select().table('user_list').asCallback(function(err, results){
		if(err){
			console.log('error in listing all users');
			return cb(err, 'failed');
		}
		return cb(err, results);
	});
}

function newUser(db, myuser, cb){
	// console.log("new user");
	db.table('user_list').insert({
		user_id: myuser.user_id,
		password: myuser.password,
		invitation_code: myuser.invitation_code	
	}).asCallback(function(err, result){
		if(err){
			console.log('error in adding new user');
			return cb(err, 'failed');
		}else{
			return cb(err, 'success');
		}
	});
}

function deleteUser(db, user_id, cb){
	console.log("delete user");
	db.table('user_list').where({
		user_id: user_id
	}).del().asCallback(function(err, result){
		if(err){
			console.log('error in deleting user');
			return cb(err, 'failed');
		}else{
			return cb(err, 'success');
		}
	});
}

function editUser(db, new_user, old_user_id, cb){
	console.log("edit user");
	db.table('user_list').where({
		user_id: old_user_id
	}).update({
		user_id: new_user.user_id,
		password: new_user.password,
		invitation_code: new_user.invitation_code
	}).asCallback(function(err, result){
		if(err){
			console.log('error in editing user');
			return cb(err, 'failed');
		}else{
			return cb(err, 'success');
		}
	});
}

function register(db, new_user, cb){
	// console.log("new register:"+new_user.invitation_code);
	db.table('user_invcode_list').where({
		invitation_code: new_user.invitation_code
	}).select().asCallback(function(err, result)
	{
		if(err){
			console.error('error in registering');
			return cb(err, 'failed in db phase');
		}else{
			if(!result){
				console.error('empty satisfying set');
				return cb(err, 'invalid invitation code');
			}
			result.forEach(function(res){
				if(res.invitation_code == new_user.invitation_code && res.max_users > 0 && res.current_users < res.max_users)
				{
					// matching invitation code, inserting
					var current_users = res.current_users + 1;
					newUser(db, new_user, function(err1, msg){
						if(err1 || msg != 'success'){
							return cb(err1, msg);
						}else{
							db.table('user_invcode_list').where({invitation_code: new_user.invitation_code}).update({
								current_users: current_users
							}).asCallback(function(err2, update_res)
							{
								if(err2){
									return cb(err2, 'failed');
								}else{
									console.log('register successful');
									return cb('', 'success');
								}
							});// end update
						}	// return cb(err, 'success');
					}); // end new user 
				}else{
					return cb(err, 'invalid invitation code');
				} //end if
			}); //end for each	
		}// end if else
	});//end callback
}

// invitation code

function findAll_inv(db, cb){
	// console.log("listing all invitation codes");
	db.select().table('user_invcode_list').asCallback(function(err, results){
		if(err){
			console.error('error in listing all users');
			return cb(err, 'failed');
		}
		return cb(err, results);
	});
}

function findInv(db, invitation_code, cb){
	// console.log("finding invitation code");
	db.first().from('user_invcode_list').where('invitation_code', '=', invitation_code).asCallback(function(err, result){
		if(err){
			return cb(err);
		}
		var t = null;
		t = result;
		return cb(err, t);
	});	
}



function newInv(db, myinv, cb){
	// console.log("new invitation code");
	db.table('user_invcode_list').insert({
		invitation_code: myinv.invitation_code,
		max_users: myinv.max_users,
		current_users: myinv.current_users
	}).asCallback(function(err, result){
		if(err){
			console.error('error in adding new invitation code');
			return cb(err, 'failed');
		}else{
			return cb(err, 'success');
		}
	});
}

function deleteInv(db, invitation_code, cb){
	// console.log("delete invitation code");
	db.table('user_invcode_list').where({
		invitation_code: invitation_code
	}).del().asCallback(function(err, result){
		if(err){
			console.error('error in deleting invitation code');
			return cb(err, 'failed');
		}else{
			return cb(err, 'success');
		}
	});
}

function editInv(db, new_inv, old_invitation_code, cb){
	// console.log("edit invitation code");
	db.table('user_invcode_list').where({
		invitation_code: old_invitation_code
	}).update({
		invitation_code: new_inv.invitation_code,
		max_users: new_inv.max_users,
		current_users: new_inv.current_users
	}).asCallback(function(err, result){
		if(err){
			console.log('error in editing invitation code');
			return cb(err, 'failed');
		}else{
			return cb(err, 'success');
		}
	});
}

function saveMatchToUser(db, user_id, match_id, is_public){
	//console.log('DEBUG: Insert match_id:' + match_id + ' for user_id:' + user_id +'.');
	db.table('user_match_list').first().where({
		user_id: user_id,
		match_id: match_id
	}).then(function(result){
		//console.log('DEBUG: matches result' + JSON.stringify(result));
		if(!result || result == undefined){
			db.table('user_match_list').insert({
				user_id: user_id,
				match_id: match_id
			}).asCallback(function(err, result){
				if(err){
					console.error(err);
					return;
				}
				console.log('succeeded wrote');
			});	
		}else{
			// do nothing unless something needed
		}
	});
}

function getMatchData(db, user_id, cb){
	//lordstone: notice that both db and db exist here
	db.table('user_match_list').where({
		user_id: user_id
	}).select().asCallback(function(err, results){
		if(err){
			return cb({error: 'error:' + err});
		}
		if(!results || results == undefined){
			return cb(null);
		}
		//console.log('DEBUG:' + results + '|' + JSON.stringify(results));
		var match_id_set = [];
		if(!matches || !matches.length){
			return cb(null);
		}
		for(var i = 0; i < matches.length; i ++){
			//console.log('DEBUG: match:' + JSON.stringify(match_entry));
			var match_id = results[i]['match_id'];
			//console.log('DEBUG: get match_id:' + match_id);
			match_id_set.push(match_id);
		}
		db.table('matches').select('match_id', 'upload').whereIn('match_id', match_id_set).asCallback(function(err, results)
		{
			if(err){
				return cb({error: 'error:' + err});
			}
			//console.log('DEBUG: found:' + JSON.stringify(results));
			return cb(results);
		});
	});

}

/*
function deleteUserMatch(db, user_id, match_id, cb){
//lordstone: logic: find user's matches, delete the match_id from user.
// if this user is the only allowed user, delete the match from both user and yasp db
	db.table('user_list').first('matches').where('user_id', user_id).asCallback(function(err, result)
	{
		console.log('DEBUG: my users find user_id cb');
		if(err){
			console.log('DEBUG: deleteUserMatch db err:' + err);
			return cb(err);
		}
		var my_matches = result['matches'];
		console.log('DEBUG: it will have ' + my_matches.length + ' loop');
		var mark = false;
		for(var i = 0; i < my_matches.length; i += 1){
			console.log('DEBUG: in for loop. mymatches[i]:' + my_matches[i]['match_id']);
			if(my_matches[i]['match_id'] == match_id){
				// if this user has the access to the match
					mark = true;
					console.log('DEBUG: match id matches');
					my_matches.splice(i, 1);
					console.log('DEBUG: after splice:' + JSON.stringify(my_matches));
					db.table('user_list')
					.where('user_id', user_id)
					.update({
						matches: JSON.stringify(my_matches)
					}).then(function(msg1)
					{
						//start 
						console.log('DEBUG: update user matches done');
						db.table('my_match_list')
						.first('users_allowed')
						.where('match_id', match_id)
						.then(function(results)
						{
						console.log('DEBUG: show match list json:' + JSON.stringify(results));
						var users_allowed = results['users_allowed'];
						var mark2 = false;
						for(var j = 0; j < users_allowed.length; j ++)
						{
							if(users_allowed[i]['user_id'] == user_id){
								mark2 = true;
								if(users_allowed.length == 1){
									//need to delete match in yasp
									console.log('DEBUG: the only user : match');
									db.table('my_match_list')
									.where('match_id', match_id)
									.del()
									.then(function(msg)
									{
										console.log('DEBUG: delete match list done');
										db.table('matches')
										.where('match_id', match_id)
										.del()
										.then(function(msg)
										{
											console.log('DEBUG: delete yasp match done');
											return cb(msg);
										});
									});
								}else{
									console.log('DEBUG: no need to delete match list');
									//no need to delete match in yasp
									users_allowed.splice(i, 1);
	 								db.table('my_match_list')
									.where('match_id', match_id)
									.update({
										users_allowed: JSON.stringify(users_allowed)
									}).then(function(msg){
										console.log('DEBUG: delete yasp match done');
										return cb(msg);
									});
								}//end if
								break;
							}//end if
						}//end for
						if(mark2 == false){
							return cb(msg1);
						}
					});// end cb
				});//end then
				break;
			}//end if
		}//end for
		if(mark == false){
			return cb(result);
		}
	});//end cb
}
*/

module.exports = {
	logUser: logUser,
	logoutUser: logoutUser,
	findAll: findAll,
	newUser: newUser,
	deleteUser: deleteUser,
	editUser: editUser,
	findUser: findUser,
	register: register,
	findAll_inv: findAll_inv,
	findInv: findInv,
	newInv: newInv,
	editInv: editInv,
	deleteInv: deleteInv,
	saveMatchToUser: saveMatchToUser,
	getMatchData: getMatchData
	// deleteUserMatch: deleteUserMatch
};

