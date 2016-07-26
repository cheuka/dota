var user_mgmt = require('../store/userMgmt');
var config = require('../config');

function checkUser(db, user_id, password, cb)
{ 
	if(user_id == config.CHEUKA_ADMIN && password == config.CHEUKA_ADMIN_PASSWORD)
	{
		return cb('success', {user_id: 'admin'});
	}else{
		user_mgmt.logUser(db, user_id, password, function(msg, param)
		{
			if(msg == 'failed'){
				console.log('log in failed, reason:' + param);
				return cb('failed', null);
			}else if(msg == 'logged'){
				return cb('logged', null);
			}else if(msg == 'success'){
				return cb('success', param);
			}
		});
	}
}

function logoutUser(db, user_id, cb){
	user_mgmt.logoutUser(db, user_id, function(){
		return cb();
	});
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
		//console.log('cheuka level');
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

function checkMatchId(db, user_id, match_id){
	if(user_id == 'admin') return true;
	return user_mgmt.checkMatchId(db, user_id, match_id);
}

function saveMatchToUser(db, user_id, match_id, is_public){
	return user_mgmt.saveMatchToUser(db, user_id, match_id, is_public);
}

function getMatchList(db, user_id, cb){
	user_mgmt.getMatchList(db, user_id, function(results){
		return cb(results);
	});
}

function getMatchData(db, user_db, user_id, cb){
	user_mgmt.getMatchData(db, user_db, user_id, function(results){
		return cb(results);
	});
}

function deleteUserMatch(db, user_db, user_id, match_id, cb){
	user_mgmt.deleteUserMatch(db, user_db, user_id, match_id, function(results){
		return cb(results);
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
	checkMatchId: checkMatchId,
	saveMatchToUser: saveMatchToUser,
	getMatchList: getMatchList,
	getMatchData: getMatchData,
	deleteUserMatch: deleteUserMatch
};
