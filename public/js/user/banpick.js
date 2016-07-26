/* This is the js for banpick page
 * for cheuka's dota
 * by lordstone
 */

const LEFT_TIMER = 0;
const RIGHT_TIMER = 1;
const LEFT_RES_TIMER = 2;
const RIGHT_RES_TIMER = 3;

const LEFT_BAN = 1;
const RIGHT_BAN = 2;
const LEFT_PICK = 3;
const RIGHT_PICK = 4;

const BP_START = 0;
const BP_CONFIRM = 5;
const BP_END = 6;

const STATUS_TEXT = [
	'Ready to Start',     // 0 
	'Radiant Ban',        // 1
	'Dire Ban',           // 2
	'Radiant Pick',       // 3
	'Dire Pick',          // 4
	'Finished: Confirm?',          // 5
	'Save'				  // 6				
];

const BUTTON1_TEXT = [
	'Game Mode',     // 0 
	'Ban',        // 1
	'Ban',           // 2
	'Pick',       // 3
	'Pick',          // 4
	'Confirm',           // 5
	'Save to Cloud'            // 6
];

var BUTTON2_TEXT = [
	'Easy Mode',     // 0 
	'Pause',        // 1
	'Pause',           // 2
	'Pause',       // 3
	'Pause',          // 4
	'Restart',           // 5
	'Save to File'      // 6
];

const BUTTON2_TEXT_EASY = [
	'Easy Mode',     // 0 
	'Undo',        // 1
	'Undo',           // 2
	'Undo',       // 3
	'Undo',          // 4
	'Restart',           // 5
	'Save to File'      // 6
];

const EMPTY_BAN_HERO = -1;

var user_defined_procedure;

// time:
var times = {
	normalTime: 30,
	reserveTime: 130 
};

// may be replaced by user-defined procedure
var procedure = [
	BP_START,
	LEFT_BAN, RIGHT_BAN, LEFT_BAN, RIGHT_BAN,         // 4
	LEFT_PICK, RIGHT_PICK, RIGHT_PICK, LEFT_PICK,     // 4
	RIGHT_BAN, LEFT_BAN, RIGHT_BAN, LEFT_BAN,         // 4
	RIGHT_PICK, LEFT_PICK, RIGHT_PICK, LEFT_PICK,     // 4
	RIGHT_BAN, LEFT_BAN,                              // 2
	LEFT_PICK, RIGHT_PICK,                            // 2
	BP_CONFIRM, BP_END                             
];                                                  // 20

var is_reserved_time = false;

var paused_timekeep = 0;

var radiant_reserved_time = times.reserveTime;
var dire_reserved_time = times.reserveTime;

var is_radiant_turn = true;

var cur_procedure = 0;

var cur_src = '';

var hero_slots = {
	radiant_ban: [],
	radiant_pick: [],
	dire_ban: [],
	dire_pick: []
};

var selected_hero;

var game_mode = true;

var timer;
var timer_secs;
var timer_cb;
var timer_index;

var is_paused = false;

var last_slot = null;

function saveBanpick(){
	// setStatus();
}

function getTimerIndex(proc){
	var my_index = (proc - 1) % 2 ;
	return is_reserved_time ? my_index + 2 : my_index;
}

function setStatus(){
	$('#main_status').html(STATUS_TEXT[procedure[cur_procedure]]);
	$('#button1').html(BUTTON1_TEXT[procedure[cur_procedure]]);
	$('#button2').html(BUTTON2_TEXT[procedure[cur_procedure]]);
}

function setTimerText(){
	if(timer_index != LEFT_TIMER) $('#timer_' + LEFT_TIMER).html('00:00');
	if(timer_index != RIGHT_TIMER) $('#timer_' + RIGHT_TIMER).html('00:00');
	var min = Math.floor(parseInt(timer_secs) / 60);
	var sec = parseInt(timer_secs) % 60;
	$('#timer_' + timer_index).html((min<10 ? '0' : '') + String(min) + ':' + (sec < 10 ? '0' : '') + String(sec));
	// console.log((min<10 ? '0' : '') + String(min) + ':' + (sec < 10 ? '0' : '') + String(sec));
}

//function countDown();

function stopTimer(){
	console.log('stopTimer');
	clearTimeout(timer);
	var secs = timer_secs;
	timer_secs = 0;
	return secs;
}

function startReserve(){
	console.log('startReserve');
	if(is_radiant_turn){
		timer_secs = radiant_reserved_time + 1;
		timer_index = LEFT_RES_TIMER;
	}else{
		timer_secs = dire_reserved_time + 1;
		timer_index = RIGHT_RES_TIMER;
	}
	// setTimerText(timer_secs, timer_index);
	timer_cb = changeStatus;
	countDown();
}

function doBanpick(){
	// this will do: push selected hero into banpick/slot
  //               start the next timer
	console.log('doBanpick');
	if(selected_hero){
				// start push into selected slot
		switch(procedure[cur_procedure]){
			case (LEFT_BAN):
				hero_slots.radiant_ban.push(selected_hero);
				$('#left_ban_' + (hero_slots.radiant_ban.length - 1)).attr('src', $('#selected_hero').attr('src'));
				$('#left_ban_' + (hero_slots.radiant_ban.length - 1)).attr('title', $('#selected_hero').attr('title'));
			break;
			case (RIGHT_BAN):
				hero_slots.dire_ban.push(selected_hero);
				$('#right_ban_' + (hero_slots.dire_ban.length-1)).attr('src', $('#selected_hero').attr('src'));
				$('#right_ban_' + (hero_slots.dire_ban.length-1)).attr('title', $('#selected_hero').attr('title'));
			break;
			case (LEFT_PICK):
				hero_slots.radiant_pick.push(selected_hero);
				$('#left_pick_' + (hero_slots.radiant_pick.length-1)).attr('src', $('#selected_hero').attr('src'));
				$('#left_pick_' + (hero_slots.radiant_pick.length-1)).attr('title', $('#selected_hero').attr('title'));
			break;
			case (RIGHT_PICK):
				hero_slots.dire_pick.push(selected_hero);
				$('#right_pick_' + (hero_slots.dire_pick.length-1)).attr('src', $('#selected_hero').attr('src'));
				$('#right_pick_' + (hero_slots.dire_pick.length-1)).attr('title', $('#selected_hero').attr('title'));
			break;
			default:
				alert('Wrong js file. please contact service provider');
				return;
		}	//end switch
		$('#hero_' + selected_hero).attr('src', '');
		$('#hero_' + selected_hero).css('background-color', 'black');
	}
}

function newBanpick(){
	//setStatus();
	if(game_mode === true) {
		console.log('newBanpick');
		is_reserved_time = false;
		stopTimer();
		timer_secs = times.normalTime + 1;
		timer_cb = startReserve;
		timer_index = getTimerIndex([procedure[cur_procedure]]);
		countDown();
	}
}

function emptyBan(){
	console.log('emptyBan');
	switch(procedure[cur_procedure]){
		case(LEFT_BAN):
			hero_slots.radiant_ban.push(EMPTY_BAN_HERO);
		break;
		case(RIGHT_BAN):
			hero_slots.dire_ban.push(EMPTY_BAN_HERO);
		break;
		default:
			alert('emptyBan(). wrong js file. contact service provider');
	} //end switch
}

function randomPick(){
	console.log('randomPick');
	var rand_hero_id = parseInt(Math.random() * 112 + 1);
	var origin_hero = $('#hero_' + rand_hero_id);
	while(true){
		if(rand_hero_id != 28 && origin_hero && origin_hero.src != '')
		{
			break;	
		}
		rand_hero_id = parseInt(Math.random() * 112 + 1);
		origin_hero = $('#hero_' + rand_hero_id);
	}	
	switch(procedure[cur_procedure]){
		case(LEFT_PICK):
			hero_slots.radiant_pick.push(rand_hero_id);
			$('#left_pick_' + hero_slots.radiant_pick.length-1).attr('src', origin_hero.attr('src'));
		break;
		case(RIGHT_PICK):
			hero_slots.dire_pick.push(rand_hero_id);
			$('#right_pick_' + hero_slots.dire_pick.length-1).attr('src', origin_hero.attr('src'));
		break;
		default:
			alert('randomPick(). wrong js file. contact service provider');
	} //end switch
	
}
function extinguishSlot(){
	console.log('extinguishSlot');
	if(last_slot != null){
		last_slot.removeClass('submit_button');
	}
}

function igniteSlot(){
	console.log('ignoreSlot');
	switch(procedure[cur_procedure]){
		case (LEFT_BAN):
			$('#left_ban_' + hero_slots.radiant_ban.length).addClass('submit_button');
			last_slot = $('#left_ban_' + hero_slots.radiant_ban.length);
		break;
		case (RIGHT_BAN):
			$('#right_ban_' + hero_slots.dire_ban.length).addClass('submit_button');
			last_slot = $('#right_ban_' + hero_slots.dire_ban.length);
		break;
		case (LEFT_PICK):
			$('#left_pick_' + hero_slots.radiant_pick.length).addClass('submit_button');
			last_slot = $('#left_pick_' + hero_slots.radiant_pick.length);
		break;
		case (RIGHT_PICK):
			$('#right_pick_' + hero_slots.dire_pick.length).addClass('submit_button');
			last_slot = $('#right_pick_' + hero_slots.dire_pick.length);
		break;
	} // end switch
}

function doConfirm(){
	console.log('doConfirm');
	for(var i = 0; i < 5; i ++){
		$('#left_hero_slot_' + i).attr('src', $('#left_pick_' + i).attr('src'));
		$('#right_hero_slot_' + i).attr('src', $('#right_pick_' + i).attr('src'));
		$('#left_hero_slot_' + i).attr('title', $('#left_pick_' + i).attr('title'));
		$('#right_hero_slot_' + i).attr('title', $('#right_pick_' + i).attr('title'));
	}
}

function changeStatus(passed){
	console.log('changeStatus');
	extinguishSlot();
	if(is_reserved_time === true){
		// if clicked
		if(passed === false){
			if(is_radiant_turn === true){
				radiant_reserved_time = stopTimer();
			}else{
				dire_reserved_time = stopTimer();
			}
		}else if(passed === true){
			switch(procedure[cur_procedure]){
				case(LEFT_BAN):
				case(RIGHT_BAN):
					emptyBan();
				break;
				case(LEFT_PICK):
				case(RIGHT_PICK):
					randomPick();
				break;
				default:
					alert('wrong js file. Contact service provider.');
					return;					
			} // end switch
			if(is_radiant_turn === true){
				radiant_reserved_time = 0;
			}else{
				dire_reserved_time = 0;
			}
		}
		is_reserved_time = false;
	}else{
		if(game_mode === true) 
			stopTimer();
	}
	switch(procedure[cur_procedure])
	{
		case(BP_START):
			cur_procedure += 1;
			if(game_mode === true) {
				newBanpick();
				$('#button2').attr('disabled', false);
			}
			$('#button1').attr('disabled', true);
			igniteSlot();
		break;
		case(LEFT_BAN):
		case(RIGHT_BAN):
		case(LEFT_PICK):
		case(RIGHT_PICK):
			if(passed === false) 
				doBanpick();
			cur_procedure += 1;
			if(procedure[cur_procedure] < BP_CONFIRM){
				$('#button1').attr('disabled', true);
				$('#button2').attr('disabled', false);
				newBanpick();
			}else{
				if(game_mode === true) 
					stopTimer();
				$('#button').attr('disabled', false);		
			}
			igniteSlot();
			is_radiant_turn = (procedure[cur_procedure] === LEFT_BAN || procedure[cur_procedure] === LEFT_PICK);
		break;
		case(BP_CONFIRM): // to confirm
			cur_procedure += 1;	
			doConfirm();
			$('#button').attr('disabled', false);		
		break;
		case(BP_END):  // confirmed & finished
			// Save the BP result
			saveBanpick();
			cur_procedure = BP_START;
		break;
		default:
			alert('JS file wrong. Contact service provider!');
			return;
	}// end switc
	setStatus();
}

function doPause(){
	console.log('doPause');
	if(is_paused === false){
		is_paused = true;
		$('#button2').html('Resume');
		paused_timekeep = stopTimer();
	}else{	
		is_paused = false;
		$('#button2').html('Pause');
		timer_secs = paused_timekeep + 1;
		countDown();
	}
}

function countDown(){
	// console.log('time:' + timer_secs);
	timer_secs -= 1;
	setTimerText();
	if(timer_secs <= 0){
		console.log('It is time!');
		stopTimer();
		if(timer_cb == changeStatus)
			timer_cb(true);
		else
			timer_cb();
	}else{
		timer = setTimeout('countDown()', 1000);
	}
}

function doUndo(){
	if(cur_procedure <= 1) return;
	extinguishSlot();
	cur_procedure -= 1;
	switch(procedure[cur_procedure]){
		case (LEFT_BAN):
			var tmp_id = hero_slots.radiant_ban[hero_slots.radiant_ban.length-1];
			var tmp = $('#left_ban_' + (hero_slots.radiant_ban.length - 1));
			var tmp_src = tmp.attr('src');
			var tmp_title = tmp.attr('title');
			tmp.attr('src', '');
			tmp.attr('title', '');
			$('#hero_' + tmp_id).attr('src', tmp_src);
			$('#hero_' + tmp_id).attr('title', tmp_title);
			$('#hero_' + tmp_id).css('background-color','none');
			pick_hero(tmp_id);
			hero_slots.radiant_ban.pop();
		break;
		case (RIGHT_BAN):	
			var tmp_id = hero_slots.dire_ban[hero_slots.dire_ban.length-1];
			var tmp = $('#right_ban_' + (hero_slots.dire_ban.length - 1));
			var tmp_src = tmp.attr('src');
			var tmp_title = tmp.attr('title');
			tmp.attr('src', '');
			tmp.attr('title', '');
			$('#hero_' + tmp_id).attr('src', tmp_src);
			$('#hero_' + tmp_id).attr('title', tmp_title);
			$('#hero_' + tmp_id).css('background-color','none');
			pick_hero(tmp_id);
			hero_slots.dire_ban.pop();
		break;
		case (LEFT_PICK):
			var tmp_id = hero_slots.radiant_pick[hero_slots.radiant_pick.length-1];
			var tmp = $('#left_pick_' + (hero_slots.radiant_pick.length - 1));	
			var tmp_src = tmp.attr('src');
			var tmp_title = tmp.attr('title');
			tmp.attr('src', '');
			tmp.attr('title', '');
			$('#hero_' + tmp_id).attr('src', tmp_src);
			$('#hero_' + tmp_id).attr('title', tmp_title);
			$('#hero_' + tmp_id).css('background-color','none');
			pick_hero(tmp_id);
			hero_slots.radiant_pick.pop();
		break;
		case (RIGHT_PICK):
			var tmp_id = hero_slots.dire_pick[hero_slots.dire_pick.length-1];
			var tmp = $('#right_pick_' + (hero_slots.dire_pick.length - 1));
			var tmp_src = tmp.attr('src');
			var tmp_title = tmp.attr('title');
			tmp.attr('src', '');
			tmp.attr('title', '');
			$('#hero_' + tmp_id).attr('src', tmp_src);
			$('#hero_' + tmp_id).attr('title', tmp_title);
			$('#hero_' + tmp_id).css('background-color','none');
			pick_hero(tmp_id);
			hero_slots.dire_pick.pop();
		break;
		default:
			alert('Wrong js file. please contact service provider');
			return;
	}	//end switch
	igniteSlot();
}

// end of high level functions

function button1_click(){
	// main button
	changeStatus(false);
}

function button2_click(){
	if(procedure[cur_procedure] === BP_START){
		game_mode = false;
		changeStatus(false);
		for(var i = 0; i < 4; i ++){
			$('#timer_' + i).html('Unlimited');
		}
		BUTTON2_TEXT = BUTTON2_TEXT_EASY;
		setStatus();
		$('#button2').attr('disabled', 'true');
	}else{
	 	if(game_mode === true && procedure[cur_procedure] < BP_CONFIRM)
		{
			 doPause();
		}else if(game_mode === false && procedure[cur_procedure] <= BP_CONFIRM)
		{
			doUndo();
		}
	}
}

function pick_hero(hero_id){
	// it is working
	console.log('pick_hero');
	var tmp = $('#hero_' + hero_id);
	if(tmp.attr('src') == ''){
		return;  // already picked/banned -- ignore it
	}
	if(selected_hero){
		var old_tmp = $('#hero_' + selected_hero);
		old_tmp.css('border', 'none');
		old_tmp.removeClass('submit_button');
	}
	selected_hero = hero_id;
	tmp.css('border','yellow 2px solid');
  	tmp.addClass('submit_button');
	$('#button1').attr('disabled', false);
	var srctext = tmp.attr('src');
	var titletext = tmp.attr('title');
	$('#hero_name').html(titletext);
	$('#selected_hero').attr('src', srctext);
	$('#selected_hero').attr('title', titletext); 
}

$(document).ready(function(){
	//set init status	
	// alert('ready!');
	setStatus();
	cur_procedure = 0;
	$('#button1').attr('disabled', false);
	$('#button2').attr('disabled', false);
	if(user_defined_procedure){
		procedure = user_defined_procedure;
	}
});


