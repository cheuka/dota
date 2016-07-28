// var async = require('async');
var config = require('../config');
var async = require('async');


function logUser(db, user_id, password,  cb){
	console.log("logging user");
	db.first().from('my_users').where({
		user_id: user_id,
		password: password
	}).asCallback(function(err, res){
		if(err){
			return cb('failed', err);
		}
		if(!res){
			return cb('failed', 'unknown error');
		}
			if(res.is_logged){
					return cb('logged');
			}else{
					db('my_users').update({is_logged: true}).where({user_id: user_id}).asCallback(function(err1, result1){
						if(err1){
							console.log('update islogged error');
							return cb('failed');
						}else{
							console.log('log in successfully. user_id:' + user_id);
							return cb('success', {user_id: user_id});
						}
					});
					//return cb('success', {user:id: result.user_id});
			}
	});	
}

function logoutUser(db, user_id, cb){
	console.log("logging out user");
	db('my_users').where('user_id', '=', user_id).update({is_logged: false}).asCallback(function(err){
		if(err){
			console.log('logout failed');
			return cb();
		}
		// console.log('logout failed: cannot find the user');
		return cb();
	});	
}



function findUser(db, user_id, cb){
	console.log("finding user");
	db.first().from('my_users').where('user_id', '=', user_id).asCallback(function(err, result){
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
	db.select().table('my_users').asCallback(function(err, results){
		//results.forEach(function(res){
		//	console.log(res.user_id + ':' + res.password);
		//});		
		if(err){
			console.log('error in listing all users');
			return cb(err, 'failed');
		}
		return cb(err, results);
	});
}

function newUser(db, myuser, cb){
	console.log("new user");
	db.table('my_users').insert({
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
	db.table('my_users').where({
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
	db.table('my_users').where({
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
	console.log("new register:"+new_user.invitation_code);
	db.table('my_invitation_codes').where({
		invitation_code: new_user.invitation_code
	}).select().asCallback(function(err, result)
	{
		if(err){
			console.log('error in registering');
			return cb(err, 'failed in db phase');
		}else{
			if(!result){
				console.log('empty satisfying set');
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
						db.table('my_invitation_codes').where({invitation_code: new_user.invitation_code}).update({
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
			// end inserting
			}); //end for each	
			// return cb(err, 'invalid invitation code');
		}// end if else
	});//end callback
}

// invitation code

function findAll_inv(db, cb){
	console.log("listing all invitation codes");
	db.select().table('my_invitation_codes').asCallback(function(err, results){
		if(err){
			console.log('error in listing all users');
			return cb(err, 'failed');
		}
		return cb(err, results);
	});
}

function findInv(db, invitation_code, cb){
	console.log("finding invitation code");
	db.first().from('my_invitation_codes').where('invitation_code', '=', invitation_code).asCallback(function(err, result){
		if(err){
			return cb(err);
		}
		var t = null;
		t = result;
		return cb(err, t);
	});	
}



function newInv(db, myinv, cb){
	console.log("new invitation code");
	db.table('my_invitation_codes').insert({
		invitation_code: myinv.invitation_code,
		max_users: myinv.max_users,
		current_users: myinv.current_users
	}).asCallback(function(err, result){
		if(err){
			console.log('error in adding new invitation code');
			return cb(err, 'failed');
		}else{
			return cb(err, 'success');
		}
	});
}

function deleteInv(db, invitation_code, cb){
	console.log("delete invitation code");
	db.table('my_invitation_codes').where({
		invitation_code: invitation_code
	}).del().asCallback(function(err, result){
		if(err){
			console.log('error in deleting invitation code');
			return cb(err, 'failed');
		}else{
			return cb(err, 'success');
		}
	});
}

function editInv(db, new_inv, old_invitation_code, cb){
	console.log("edit invitation code");
	db.table('my_invitation_codes').where({
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

function checkMatchId(db, user_id, match_id){
	console.log('DEBUG: find the match list log');
	db.table('my_match_list').select('users_allowed').where({
		match_id: match_id
	}).asCallback(function(err, result){
		if(err){
			console.log('error in finding that match');
			return false;
		}else{
			if(!result){
				//meaning public match
				return true;
			}else{
				var user_array = result;
				console.log('DEBUG: output user_array:'+user_array);
				for(var i = 0; i < user_array.length; i++){
					if(user_array[i].user_id == user_id){
						return true;
					}
				}
				return false; // user_id not in the list
			}	
		}
	});
}

function saveMatchToUser(db, user_id, match_id, is_public){
	//console.log('DEBUG: Insert match_id:' + match_id + ' for user_id:' + user_id +'.');
	console.log('DEBUG:is_public:' + is_public);
	db.table('my_users').first('matches').where({
		user_id: user_id
	}).then(function(result){
		//console.log('DEBUG: matches result' + JSON.stringify(result));
		// var match_array = result;
		if(!result || result == undefined || !result['matches'] || result['matches'] == null){
			// if it is an empty one
			//console.log('DEBUG: empty match list');
			var match_array = [{
				match_id: match_id
			}];
			// match_array = {matches: match_array};
			result = match_array;
		}else{
			// if you need to push in
			//console.log('DEBUG: not empty match list');
			result['matches'].push({
				match_id: match_id
			});
			result = result['matches'];
		}
		//console.log('DEBUG: saving to USERLIST stringify:' + JSON.stringify(result));
		return db.table('my_users').where({
			user_id: user_id
		}).update({
			matches: JSON.stringify(result)
		}); 
	}).then(function(result){
		//console.log('DEBUG: saving to MATCHLIST results:' + JSON.stringify(result));
		// Start updating the match list
		db.table('my_match_list').first('users_allowed','is_public').where({
			match_id: match_id
		}).asCallback(function(err, result){
 	    //console.log('DEBUG: MATCHLIST result:' + JSON.stringify(result));	
			if(result && result != undefined){
					var user_array = result['users_allowed'];
					var old_public = result['is_public'];
					var repeatedUser = false;
					for(var i = 0; i < user_array.length; i++){
						if(user_array[i] == user_id){
							//console.log('DEBUG: found exising user_id in matchlist');
							if(old_public == is_public){
								return;
							}
							repeatedUser = true;
						}
					}
					//console.log('DEBUG: not found existing user_id');
					if(repeatedUser == false)
						user_array['users_allowed'].push({user_id: user_id});
					user_array = user_array['users_allowed'];
					return db.table('my_match_list').where({
						match_id: match_id
					}).update({
						users_allowed: JSON.stringify(user_array),
						is_public: (is_public || old_public)
					}).asCallback(function(err, result){
						if(err){
							console.log('update match list in user_db failed');
						}
						return;
					});
			}else{
				// if nothing there
				//console.log('DEBUG: adding new user_array');
				var user_array = [{user_id: user_id}];
				//console.log('DEBUG: user_array:' + JSON.stringify(user_array));
				return db.table('my_match_list').insert({
					match_id: match_id,
					users_allowed: JSON.stringify(user_array),
					is_public: is_public
				}).asCallback(function(err, result){
					if(err){
						console.log('DEBUG:ERROR: ' + err);
					}
					return;
				});
			}
		});
// end of updating match list	
	}).catch(function(e){
		console.log('DEBUG:ERROR:Find my_user err: '+ e);
		return;
	});
	// make it public
}

function getMatchList(db, user_id, cb){
	db.table('my_users').first('matches').where({
		user_id: user_id
	}).asCallback(function(err, results){
		if(err){
			return cb(JSON.stringify({error: e}));
		}
		//console.log('DEBUG: match result:' + JSON.stringify(results));
		return cb(results);
	}).catch(function(e){
		console.log('DEBUG: getMatchList error:' + e);
		return JSON.stringify({error: e});
	});
}

function getMatchData(db, user_db, user_id, cb){
	//lordstone: notice that both user_db and db exist here
	user_db.table('my_users').where({
		user_id: user_id
	}).first('matches').asCallback(function(err, results){
		if(err){
			return cb({error: 'error:' + err});
		}
		if(!results || results == undefined){
			return cb(null);
		}
		//console.log('DEBUG:' + results + '|' + JSON.stringify(results));
		var match_id_set = [];
		// var res_set = [];
		var matches = results['matches'];
		if(!matches || !matches.length){
			return cb(null);
		}
		for(var i = 0; i < matches.length; i ++){
			//console.log('DEBUG: match:' + JSON.stringify(match_entry));
			var match_id = matches[i]['match_id'];
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

	/*
	if(!results.length || results.length == 0){
    res.json({status: 'empty'});
  }
  for(match_obj in results){
	  var match_id = match_obj['match_id'];
    var match_json;
    if(formitems['bp']){
      var bp = cheuka_session.getBP();
    }
  }
	*/
}

function deleteUserMatch(db, user_db, user_id, match_id, cb){
//lordstone: logic: find user's matches, delete the match_id from user.
// if this user is the only allowed user, delete the match from both user and yasp db
	user_db.table('my_users').first('matches').where('user_id', user_id).asCallback(function(err, result)
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
					user_db.table('my_users')
					.where('user_id', user_id)
					.update({
						matches: JSON.stringify(my_matches)
					}).then(function(msg1)
					{
						//start 
						console.log('DEBUG: update user matches done');
						user_db.table('my_match_list')
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
									user_db.table('my_match_list')
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
	 								user_db.table('my_match_list')
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
	checkMatchId: checkMatchId,
	saveMatchToUser: saveMatchToUser,
	getMatchList: getMatchList,
	getMatchData: getMatchData,
	deleteUserMatch: deleteUserMatch
};

