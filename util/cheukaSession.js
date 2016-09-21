var user_mgmt = require('../store/userMgmt');
var config = require('../config');
var util = require('../util/utility');

function checkUser(db, redis, user_id, password, cb)
{ 
	var randStr = util.generateRandomAlphaNum(20);
	if(user_id == config.CHEUKA_ADMIN && password == config.CHEUKA_ADMIN_PASSWORD)
	{
		redis.set('user_auth:admin', randStr);
		return cb('success', {
			user_id: 'admin',
			log_token: randStr
		});
	}else{
		user_mgmt.logUser(db, user_id, password, function(msg, param)
		{
			if(msg == 'failed'){
				return cb('failed', null);
			}else if(msg == 'success'){
				redis.set('user_auth:' + user_id, randStr);
				return cb('success', {
					user_id: param.user_id,
					log_token: randStr
				});
			}
		});
	}
}

function logoutUser(redis, user_id, cb){
	redis.del('user_auth:' + user_id);
	return cb();
}

function findUser(db, user_id, cb)
{
	user_mgmt.findUser(db, user_id, function(err, t)
	{
		if(err){
			return cb('failed', null);
		}else{
			return cb('success', t);
		}
	});
}

function findAll(db, cb){
// lordstone
	user_mgmt.findAll(db, function(err, all_users){
		return cb(all_users);
	});
}

function editUser(db, new_user, old_user_id, cb){
//lordstone
	user_mgmt.editUser(db, new_user, old_user_id, function(err, msg){
		if(msg=='success'){
			return cb('success');
		}else{
			return cb('failed');
		}
	});	
}

function newUser(db, new_user, cb){
//lordstone
	user_mgmt.newUser(db, new_user, function(err, msg){
		if(msg=='success'){
			return cb('success');
		}else{
			return cb('failed');
		}
	});	
}

function deleteUser(db, user_id, cb){
//lordstone
	user_mgmt.deleteUser(db, user_id, function(err, msg){
		if(msg=='success'){
			return cb('success');
		}else{
			return cb('failed');
		}
	});	
}

function register(db, new_user, cb){
	user_mgmt.register(db, new_user, function(err, msg){
		if(msg == 'success'){
			return cb('success');
		}else{
			return cb(msg);
		}
	});
}

// invitation codes:

function findAll_inv(db, cb){
// lordstone
	user_mgmt.findAll_inv(db, function(err, all_inv){
		return cb(all_inv);
	});
}

function findInv(db, invitation_code, cb)
{
	user_mgmt.findInv(db, invitation_code, function(err, t)
	{
		if(err){
			return cb('failed', null);
		}else{
			return cb('success', t);
		}
	});
}



function editInv(db, new_inv, old_invitation_code, cb){
//lordstone
	user_mgmt.editInv(db, new_inv, old_invitation_code, function(err, msg){
		if(msg=='success'){
			return cb('success');
		}else{
			return cb('failed');
		}
	});	
}

function newInv(db, new_inv, cb){
//lordstone
	user_mgmt.newInv(db, new_inv, function(err, msg){
		if(msg=='success'){
			return cb('success');
		}else{
			return cb('failed');
		}
	});	
}

function deleteInv(db, invitation_code, cb){
//lordstone
	user_mgmt.deleteInv(db, invitation_code, function(err, msg){
		if(msg=='success'){
			return cb('success');
		}else{
			return cb('failed');
		}
	});	
}

function saveMatchToUser(db, user_id, match_id, is_public){
	return user_mgmt.saveMatchToUser(db, user_id, match_id, is_public);
}

function getMatchData(db, user_id, cb){
	user_mgmt.getMatchData(db, user_id, function(results){
		return cb(results);
	});
}

/*
function deleteUserMatch(db, user_id, match_id, cb){
	user_mgmt.deleteUserMatch(db, user_id, match_id, function(results){
		return cb(results);
	});
}
*/

function userAuth(redis, user_id, log_token, cb){
	redis.get('user_auth:' + user_id, function(err, results){
		if(results == null){
			return cb(false);
		}else{
			if(results === log_token){
				return cb(true);
			}
			return cb(false);
		}
	});
}

function checkMatchId(db, user_id, match_id, cb){
	user_mgmt.checkMatchId(db, user_id, match_id, function(result)
	{
		return cb(result);
	});
}

function findAllUploads(db, user_id, cb)
{
	user_mgmt.findAllUploads(db, user_id, function(err, result)
	{
		if(err)
		{
			return cb(err);
		}
		return cb(null, result);
	});
}

module.exports = {
	findAll: findAll,
	findUser: findUser,
	editUser: editUser,
	deleteUser: deleteUser,
	newUser: newUser,
	checkUser: checkUser,
	register: register,
	findAll_inv: findAll_inv,
	findInv: findInv,
	editInv: editInv,
	newInv: newInv,
	deleteInv: deleteInv,
	logoutUser: logoutUser,
	saveMatchToUser: saveMatchToUser,
	getMatchData: getMatchData,
	// deleteUserMatch: deleteUserMatch,
	userAuth: userAuth,
	checkMatchId: checkMatchId,
	findAllUploads: findAllUploads
};
