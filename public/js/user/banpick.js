/* This is the js for banpick page
 * for cheuka's dota
 * by lordstone
 */

// const DATA - RELATED
// must be the same with server side

// utility

const ROMAN_NUMBER = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

// end of utility

const CONST_MATCH_ODDS = 0;
const CONST_WINNING_RATES = 1;

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

const COMBO_DISPLAY_THRESHOLD = 2;

var user_defined_procedure;

// user sequence definition
var is_user_radiant = true;
var is_user_first_pick = true;

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

// DATA-RELATED vars

var user_team = '0';
var enemy_team = '0';

// utility

function getHeroImg(hero_id){
	var img0 = $('<img>');
	var src_img = $('#hero_' + hero_id);
	img0.attr('src', src_img.attr('src'));
	img0.attr('title', src_img.attr('title'));
	img0.attr('style', src_img.attr('style'));
	return img0;
}

function getHeroSrc(hero_id){
	// var src_img = $('#hero_' + hero_id);
	// return src_img.attr("src");
	return ('/public/images/hero_icons/' + hero_id + '.png');
}

function getHeroTitle(hero_id){
	var src_img = $('#hero_' + hero_id);
	return src_img.attr("title");
}

function home_team_sel_change(){
	user_team = $('#home_team_sel').val();
}

function enemy_team_sel_change(){
	enemy_team = $('#enemy_team_sel').val();
	if(!(enemy_team == 0 || enemy_team == '0')){
		getBP2();
	}
}

function tabKey(key){
	// lordstone: press button to switch tabs
	console.log('DEBUG you pressed:' + key.keyCode);
	var tmpint = parseInt(key.keyCode);
	if(tmpint >= 49 && tmpint <= 51){
		$('#mytab a:eq(' + (tmpint - 49) + ')').tab('show');
	}
}


// server comm logics

function requestAPI(req_var, cb){
	$.post(
		'/api/banpick/',
		JSON.stringify(req_var),
		function(reply){
			var reply_obj = JSON.parse(reply);
			return cb(reply);
		}
	);
}

function renderComboList(mylist, container){
	
	// lordstone: render mylist on table container:
	var tbody0 = $('<tbody></tbody>');
	var thead0 = $('<tr></tr>');
	var theadrow_0 = $('<th></th>');
	theadrow_0.attr('colspan', '5');
	theadrow_0.css('min-width', '200px');
	theadrow_0.html('Hero Combo');
	theadrow_0.appendTo(thead0);
	var theadrow_1 = $('<th></th>');
	theadrow_1.html('Matches');
	// theadrow_1.attr('colspan', '3');
	theadrow_1.appendTo(thead0);
	var theadrow_2 = $('<th></th>');
	theadrow_2.html('Wins');
	// theadrow_2.attr('colspan', '3');
	theadrow_2.appendTo(thead0);
	thead0.appendTo(tbody0);
	for(var i = 0; i < mylist.length; i ++){
		if(i > 19){
			break;
		}// protect the f/e display with limit
		var tr0 = $('<tr></tr>');
		var td_0 = $('<td></td>');
		td_0.attr('colspan', '5');
		if(!mylist[i].heroes || mylist[i].heroes.length == 0){
			// lordstone: instead of display msg, skip them
			// td_0.val('missing hero combo');
		}else if(mylist[i].matches < COMBO_DISPLAY_THRESHOLD){
			continue;
		}else{
			// var heroes = '';
			for(var j = 0; j < mylist[i].heroes.length; j++){
				// adding heros
				var hero_img = getHeroImg(mylist[i].heroes[j]);
				hero_img.appendTo(td_0);
				// heroes += mylist[i].heroes[j].toString();
				// heroes += ', ';
				if(j !== mylist[i].heroes.length - 1){
					var plus_sign = $('<span></span>');
					plus_sign.html(' + ');
					plus_sign.appendTo(td_0);
				}
			}
			// td_0.html(heroes);
		}
		td_0.css('min-width', '200px');
		td_0.appendTo(tr0);
		var td_1 = $('<td></td>');
		td_1.html(mylist[i].matches);
		td_1.appendTo(tr0);
		var td_2 = $('<td></td>');
		td_2.html(mylist[i].wins);
		td_2.appendTo(tr0);
		tr0.appendTo(tbody0);
	}
	tbody0.appendTo(container);
}

function getCombo(){
	var user_bp = {
		type: "combo",
		user_team: user_team,
		enemy_team: enemy_team,
		is_user_radiant: is_user_radiant,
		is_user_first_pick: is_user_first_pick,
		is_picking: 
			( procedure[cur_procedure] === LEFT_PICK ||
			procedure[cur_procedure] === RIGHT_PICK ),
		is_user_turn: (is_radiant_turn === is_user_radiant),
		options: 
		{
			order_by: CONST_MATCH_ODDS,
			display:
			[
				CONST_MATCH_ODDS,
				CONST_WINNING_RATES	
			],
			list_length: 10,
			combo_max: 5,
			combo_min: 2,
			asc: false 
		},
		fixed_heroes: {
			user_picked: is_user_radiant ? hero_slots.radiant_pick : hero_slots.dire_pick,
			user_banned: is_user_radiant ? hero_slots.radiant_ban : hero_slots.dire_ban,
			enemy_picked: is_user_radiant ? hero_slots.dire_pick : hero_slots.radiant_pick,
			enemy_banned: is_user_radiant ? hero_slots.dire_ban : hero_slots.radiant_ban
		}
	};
	
	requestAPI(user_bp, function(reply)
		{
			console.log('Got msg from server for combo');
			var reply_obj = JSON.parse(reply);
			if(reply_obj && reply_obj.status && reply_obj.status == 'ok' && reply_obj.list)
			{
				console.log('DEBUG: status ok');
			}else{
				console.error('Server side bug!');
				return;
			}
			// start rendering the new list in tops i.e. combo
			$('#combo_helper').fadeOut();
			$('#hero_combo_table').empty();
			$('#hero_combo_table').fadeIn();
			// start rendering
			renderComboList(reply_obj.list, $('#hero_combo_table'));			
			
		}
	);
}

function renderBP2(mylist, container){
	
	// lordstone: trial of D3 drawing bp2
	
	const MAX_R = 20;
	const MIN_R = 2.5;

	const MARGIN_FACTOR = 0.25;

	var w = 700;
	var h = 560;

	var r = 20;

	var step_x = w / 6.5;
	var step_y = h / 6;

	var svg = d3.select("#bp2_container")
			.append("svg")
			.attr('width', w)
			.attr('height',h)
			.style('background-color:', 'gray');
	
	var dataset = [];
	// process the REAL dataset - mylist
	
	// var agg_y_offset = 0;

	for(var i = 0; i < mylist.player_slots.length; i ++)
	{
		// y-axis at this level
		var y_axis = {
			type: 'ap',
			x: (step_x * MARGIN_FACTOR),
			y: (step_y * (MARGIN_FACTOR + i)),
			text: (ROMAN_NUMBER[i]),
			r: 0
		};
		
		dataset.push(y_axis);
		
		// each player slot:
		var this_player_slot = mylist.player_slots[i].player_slot;
		var hero_num = 	mylist.player_slots[i].heroes.length;
		
		// deal with offsets

		// var clashSlots = new Array();
		// clashSlots[0] = new Array();
		var last_x = -1;
		var last_y = -1;

		var last_int_order = 0;
		// var group_num = 0;
		// loop over every single hero in each slot
		for(var j = 0; j < hero_num; j ++)
		{
			// each hero
			const con1 = Math.sqrt(4);
			var hero = mylist.player_slots[i].heroes[j];

			var text = undefined;
			var int_group = Math.round(hero.order);

			var x =  step_x * (int_group + MARGIN_FACTOR);
			var y = (this_player_slot + MARGIN_FACTOR) * step_y;
				// + agg_y_offset;
			var r = Math.min((Math.sqrt(hero.matches) / con1 ) * (MAX_R - MIN_R) + MIN_R, MAX_R)

			// deal with clashes
			if(int_group > last_int_order){
				// first elem in int order group
				last_x = x + r; // (pos-x + r) of first hero on each new slot row
				last_y = y + r; // (pos-y + r) of first hero on each new slot now
				// group_num += 1;
			}else{
				// continuing elem in group
				if(last_y + r * 2 <= y + step_y){
					// if can go down
					y = last_y + r;
					last_y = y + r;
				}else if(last_x + r * 2 <= x + step_x){
					// if cannot go down but can go right
					x = last_x + MAX_R;
					last_x = x + MAX_R;
				}else{
					// if neither can satisfy
					r = 0; // no display hero
					text = 'more...';
				}
				// group_num += 1;
			}
			last_int_order = int_group;

			// creating data point
			var dp = {
				type: 'dp',
				order: hero.order,
				slot: this_player_slot,
				hero_id: hero.hero_id,
				matches: hero.matches,
				win: hero.win,
				y: y,
				x: x,
				r: r,
				text: text
			};
			
			dataset.push(dp);

		} // end for j

	} // end for i

	// x-axis added in groups with y aggregates

	for (var i = 0; i < 5; i ++){

		var x_axis = {
			type: 'ap',
			x: (step_x * (1 + i + MARGIN_FACTOR)),
			y: (step_y * (5 + MARGIN_FACTOR)),
			text: ('#' + (i + 1)),
			r: 0
		};

		dataset.push(x_axis);
	}

	var data_info = {
		type: 'ap',
		x: (step_x * MARGIN_FACTOR),
		y: (step_y * (5 + MARGIN_FACTOR)),
		text: '(' + mylist.matches_num + ' matches)',
		r: 0,
		text_anchor: 'r'
	};

	dataset.push(data_info);

	// svg.attr('height', Math.min(h, step_y * 6));

	// end of process the REAL dataset
	// console.log('DEBUG json:' + JSON.stringify(dataset));
	// TODO: lordstone: fix the rendering issue and display the return list properly
	var dps = svg.selectAll("g")
		.data(dataset)
		.enter()
		.append("g")
		.attr("transform", function(d, i){
			return "translate(" + (d.x) + "," + (d.y) + ")";
		});

	dps.append("text")
		.attr("text-anchor", function(d){
			if(d.text_anchor == 'r'){
				return 'right';
			}else{
				return 'middle';
			}
		})
		.style("fill", "black")
		.style("font-weight", "bold")
		.attr("dy", "0.34em")
		.text(function(d){
			return d.text;
		});

	//TODO: lordstone, fix the display dilemma

	dps.append("defs")
		.append("pattern")
		.attr("id", function(d, i){return 'bp2_hero_head_' + i;})
		// .attr("patternUnits", "userSpaceOnUse")
		.attr("height", function(d){return d.r * 2.5;})
		.attr("width", function(d){return d.r * 2;})
		.append("image")/*
		.attr('alt', function(d){
			return d.text;
		})*/
		.attr("xlink:href", function(d){
			return getHeroSrc(d.hero_id);
		})
		.attr("x", function(d){return -d.r/2;})
		.attr("y", function(d){return -d.r/2;})	
		.attr("height", function(d){return d.r * 3})
		.attr("width", function(d){return d.r * 3})
		.attr("title", 'jiji');

	dps.append("circle")
		.attr("id", function(d,i){
			return 'circle_hero_' + i;
		})
		.attr("r", function(d){return d.r;})
		.attr("stroke", "black")
		.attr("stroke-width", function(d){
			return '0.5px;';
		})
		.attr("cx", 0)
		.attr("cy", 0)
		.attr("fill", function(d, i){
			return ("url(#bp2_hero_head_" + i + ")");
		})
		// lordstone: hover effect
		.attr("onmouseover", function(d, i){
			var hero_details = getHeroTitle(d.hero_id) + ': ';
			hero_details += ' Order:' + Number(d.order).toFixed(2) + '.';
			hero_details += ' Matches:' + d.matches + '.';
			hero_details += ' Win:' + d.win + '%.';
			
			var in_text = '$("#circle_hero_' + i +'").attr("stroke", "yellow")';
			in_text += '.attr("stroke-width", "4px");';
			in_text += '$("#bp2_details").html("' + hero_details +'");';
			return in_text;
		})
		.attr('onmouseout', function(d, i){
			var in_text = '$("#circle_hero_' + i +'").attr("stroke", "black")';
			in_text += '.attr("stroke-width", "0.5px");';
			in_text += '$("#bp2_details").html("See hero details");';
			return in_text;
		});
}


function getBP2(){

	var user_bp = {
		type: "bp2",
		user_team: user_team,
		enemy_team: enemy_team,
		is_user_radiant: is_user_radiant,
		is_user_first_pick: is_user_first_pick
	};
	
	requestAPI(user_bp, function(reply)
		{
			console.log('Got msg from server for BP2');
			// console.log('DEBUG:' + reply);
			var reply_obj = JSON.parse(reply);
			if(reply_obj && reply_obj.status && reply_obj.status == 'ok' && reply_obj.list)
			{
				console.log('DEBUG: status ok');
			}else{
				console.error('Server side bug!');
				return;
			}

			// start rendering the new list in tops i.e. combo
			$('#bp2_helper').fadeOut();
			$('#bp2_container').empty();
			$('#bp2_container').fadeIn();

			// start rendering
			// renderBP2List(reply_obj.list, $('#bp2_table'));	

			renderBP2(reply_obj.list, $('#bp2_container'));	
		}
	);

}

function updateWithServer(){
	console.log('Update with server!');
	$('#combo_helper').html('Waiting for server data');
	getCombo();
}

// banpick logics

function getLeftRight(input){
	//console.log('INPUT:' + input);
	if((input >= 1 && input <= 4) && ((is_user_radiant === true && is_user_first_pick === false) || (is_user_radiant === false && is_user_first_pick === true))){
		if(input % 2 == 0){
			return (input - 1);
		}else{
			return (input + 1);
		}
	}else{
		return (input);
	}
}

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

function clickRadioRadiantDire(){
	// alert('Radiant or Dire');
	var radios = document.getElementsByName('radiant_or_dire');
	is_user_radiant = radios[0].checked;
	if(radios[0].checked){
		$('#radiant_or_dire_helper_0').addClass('submit_button');
		$('#radiant_or_dire_helper_1').removeClass('submit_button');
	}else{
		$('#radiant_or_dire_helper_1').addClass('submit_button');
		$('#radiant_or_dire_helper_0').removeClass('submit_button');
	}
	// alert(is_user_radiant);
}

function clickRadioFirstPick(){
	// alert('First Pick');
	var radios = document.getElementsByName('first_pick');
	is_user_first_pick = radios[0].checked;
	// alert(is_user_first_pick);	
	if(radios[0].checked){
		$('#first_pick_helper_0').addClass('submit_button');
		$('#first_pick_helper_1').removeClass('submit_button');
	}else{
		$('#first_pick_helper_1').addClass('submit_button');
		$('#first_pick_helper_0').removeClass('submit_button');
	}

}

function switchRadios(radio_status){
	var radios_1 = document.getElementsByName('radiant_or_dire');
	var radios_2 = document.getElementsByName('first_pick');
	for(var i = 0; i < radios_1.length; i ++){
		radios_1[i].disabled = !radio_status;
	}
	for(var i = 0; i < radios_2.length; i ++){
		radios_2[i].disabled = !radio_status;
	}
}

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
		switch(getLeftRight(procedure[cur_procedure])){
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
		timer_index = getTimerIndex(getLeftRight(procedure[cur_procedure]));
		countDown();
	}
}

function emptyBan(){
	console.log('emptyBan');
	switch(getLeftRight(procedure[cur_procedure])){
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
	switch(getLeftRight(procedure[cur_procedure])){
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


function highlightSlot(slot){
	slot.css('border', '3px solid gold');
}

function dehighlightSlot(slot){
	slot.css('border', '1px solid white');
}

function extinguishSlot(){
	console.log('extinguishSlot');
	if(last_slot != null){
		dehighlightSlot(last_slot);

		// .removeClass('submit_button');
		
	}
}

function igniteSlot(){
	console.log('ignoreSlot');
	switch(getLeftRight(procedure[cur_procedure])){
		case (LEFT_BAN):
			highlightSlot(
				$('#left_ban_' + hero_slots.radiant_ban.length)
			);
			// addClass('submit_button');
			last_slot = $('#left_ban_' + hero_slots.radiant_ban.length);
		break;
		case (RIGHT_BAN):
			highlightSlot(
				$('#right_ban_' + hero_slots.dire_ban.length)
			);			// .addClass('submit_button');
			last_slot = $('#right_ban_' + hero_slots.dire_ban.length);
		break;
		case (LEFT_PICK):
			highlightSlot(
				$('#left_pick_' + hero_slots.radiant_pick.length)
			);
// .addClass('submit_button');
			last_slot = $('#left_pick_' + hero_slots.radiant_pick.length);
		break;
		case (RIGHT_PICK):
			highlightSlot(
				$('#right_pick_' + hero_slots.dire_pick.length)
			);
			// .addClass('submit_button');
			last_slot = $('#right_pick_' + hero_slots.dire_pick.length);
		break;
	} // end switch
}

function doConfirm(){
	console.log('doConfirm');
	/*
	for(var i = 0; i < 5; i ++){
		$('#left_hero_slot_' + i).attr('src', $('#left_pick_' + i).attr('src'));
		$('#right_hero_slot_' + i).attr('src', $('#right_pick_' + i).attr('src'));
		$('#left_hero_slot_' + i).attr('title', $('#left_pick_' + i).attr('title'));
		$('#right_hero_slot_' + i).attr('title', $('#right_pick_' + i).attr('title'));
	}
	*/
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
			switch(getLeftRight(procedure[cur_procedure])){
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
	// console.log('Code origin:' + procedure[cur_procedure]);
	// console.log('Code:' + getLeftRight(procedure[cur_procedure]));
	switch(getLeftRight(procedure[cur_procedure]))
	{
		case(BP_START):
			switchRadios(false);
			cur_procedure += 1;
			if(game_mode === true) {
				newBanpick();
				$('#button2').attr('disabled', false);
			}
			$('#button1').attr('disabled', true);
			igniteSlot();
			updateWithServer();
		break;
		case(LEFT_BAN):
		case(RIGHT_BAN):
		case(LEFT_PICK):
		case(RIGHT_PICK):
			updateWithServer();
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
				$('#button1').attr('disabled', false);		
			}
			igniteSlot();
			is_radiant_turn = (procedure[cur_procedure] === LEFT_BAN || procedure[cur_procedure] === LEFT_PICK);
		break;
		case(BP_CONFIRM): // to confirm
			cur_procedure += 1;	
			doConfirm();
			$('#button1').attr('disabled', false);		
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
	switch(getLeftRight(procedure[cur_procedure])){
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

	// operations:
	switchRadios(true);
	setStatus();
	cur_procedure = 0;
	$('#button1').attr('disabled', false);
	$('#button2').attr('disabled', false);
	if(user_defined_procedure){
		procedure = user_defined_procedure;
	}
	// operations end.

	// getBP2();
	
	// set tab key
	$(document).keydown(function(event){
		tabKey(event);
	});
	
});


