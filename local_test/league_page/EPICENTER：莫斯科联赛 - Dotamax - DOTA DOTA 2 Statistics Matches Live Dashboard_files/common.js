/*
	created by ghost on 2016.2.17
 * 
 * */

var testSwitch = false;
/* rootUrl */
var apiRootUrl = "http://q.maxjia.com/";

/* top nav */
$(function(){
	var menuTimer,
		$wrap = $("#top-nav .account-info-wrap"),
		$menu = $("#top-nav .account-info-wrap .menu-wrap"),
		$arrow = $("#top-nav .account-info-wrap .arrow i");
	$wrap.hover(function(){
		clearTimeout(menuTimer);
		$menu.fadeIn(200);
		$arrow.addClass("open");
	},function(){
		menuTimer = setTimeout(function(){
			$menu.fadeOut(200);
			$arrow.removeClass("open");
		},500);
	});
	$menu.mouseenter(function(){
		clearTimeout(menuTimer);
	});
	
	var $li = $("#top-nav li");
	$li.hover(function(){
		$(this).find(".nav-item-list").removeClass("hide").stop().animate({opacity:1},200);
	},function(){
		$(this).find(".nav-item-list").stop().animate({opacity:0},200,function(){
			$(this).addClass("hide");
		});
	});
});

/* nav tabs */
$(function(){
	var $tab = $(".nav-tabs > li");
	$tab.click(function(){
		var $panel = $(this).parent(".nav-tabs").siblings(".nav-panel");
		$(this).addClass("current").siblings("li").removeClass("current");
		var panelNoSlide = $(this).data("slide");
		if(panelNoSlide==1){
			$panel.eq($(this).index()).show().siblings(".nav-panel").hide();
		}else{
			$panel.eq($(this).index()).slideDown(300).siblings(".nav-panel").hide();
		}
	});
});

/* match countdown */
/*function ShowCountDown(time_end,divname) { 
    var now = new Date(); 
    var leftTime = time_end*1000-now.getTime();
    var leftsecond = parseInt(leftTime/1000); 
    var day = Math.floor(leftsecond/(60*60*24)); 
    var hour = Math.floor((leftsecond-day*24*60*60)/3600); 
    var minute = Math.floor((leftsecond-day*24*60*60-hour*3600)/60); 
    var second = Math.floor(leftsecond-day*24*60*60-hour*3600-minute*60); 
    var cc = document.getElementById(divname); 
    var out = "";
    if(day>0){
        out+= day+" 天 ";
    }
    if(hour>0){
        out+= hour+":"
    }
    if(minute<10){
        out += "0"+minute+":";
    }else{
        out += minute+":";
    }
    if(second<10){
        out += "0"+second;
    }else{
        out += second;
    }
	    if(leftsecond<=0){
	    	cc.style.color = "#C23C2A";
	    	cc.innerHTML = "等待比赛";
	    }else{
	    	cc.innerHTML = out;
	    }
}*/
function matchCD(time_end,divname) {
    var now = new Date(); 
    var leftTime = time_end*1000-now.getTime();
    var leftsecond = parseInt(leftTime/1000); 
    var day = Math.floor(leftsecond/(60*60*24)); 
    var hour = Math.floor((leftsecond-day*24*60*60)/3600); 
    var minute = Math.floor((leftsecond-day*24*60*60-hour*3600)/60); 
    var second = Math.floor(leftsecond-day*24*60*60-hour*3600-minute*60); 
    var out = "";
    
    if(day>0){
    	if(language=="en"){
    		if(day>1){
    			out+= day+" days later";
    		}else{
    			out+= day+" day later";
    		}
    	}else{
    		out+= day+" 天后 ";
    	}
    }else{
	    if(hour>0){
	        out+= hour+":"
	    }
	    if(minute<10){
	        out += "0"+minute+":";
	    }else{
	        out += minute+":";
	    }
	    if(second<10){
	        out += "0"+second;
	    }else{
	        out += second;
	    }
    }
    
    if(leftsecond<=0){
    	$("#"+divname).css({"color":"#C23C2A"});
    	$("#"+divname).html(language=="en"?"Waiting":"等待比赛");
    }else{
    	$("#"+divname).html(out);
    }
}
function matchTime(time_end,divname){
	var time = new Date(time_end*1000),
		year = time.getFullYear(),
		month = time.getMonth() + 1,
		day = time.getDate(),
		hh = time.getHours(),
		mm = time.getMinutes(),
		str = year + "-";
	if(month < 10)str += "0";
  	str += month + "-";  
  	if(day < 10)str+= "0";  
  	str += day + " ";
  	if(hh < 10)str += "0";
  	str += hh + ":";
  	if(mm < 10)str += "0";
  	str += mm;
		
	$("#"+divname+" span").html(str);
}

/* accountCheck */
var tradeLinkState = 1,//1->正确,2->错误,0->未填
	storeState = 1;//1->已公开,0->未公开
function accountCheck(){
	var url = apiRootUrl + "api/bets/get_offer_url_state/?pkey=" + pkey;
	$.get(url,function(json){
		storeState = json.result.steam_store_state;
		tradeLinkState = json.result.state;
		if(testSwitch)console.log("tradeLink: " + tradeLinkState);
		if(testSwitch)console.log("storeState: " + storeState);
		if(storeState==1){
			$(".state-store i").removeClass("glyphicon-remove fail").addClass("glyphicon-ok success");
			$(".state-store a").hide();
		}else{
			$(".state-store i").removeClass("glyphicon-ok succes").addClass("glyphicon-remove fail");
			$(".state-store a").show();
		}
		if(tradeLinkState==1){
			$(".state-link i").removeClass("glyphicon-remove fail").addClass("glyphicon-ok success");
			$(".state-link a").hide();
		}else{
			$(".state-link i").removeClass("glyphicon-ok succes").addClass("glyphicon-remove fail");
			$(".state-link a").show();
		}
	});
}

/* load item detail */
$(function(){
	var itemDetailUrl = apiRootUrl + "api/bets/get_eitem_detail/?pkey=" + pkey + "&lang=" + language;
	$(document).on("mouseenter",".item-box",function(){
		$(this).data("over","true");
		if(!$(this).hasClass("load")&&!$(this).hasClass("loading")){
			$(this).addClass("loading");
			var id = $(this).data("id"),
				defindex = $(this).data("defindex"),
				quality_id = $(this).data("quality");
			$(this).find(".item-detail").loadItemDetail({
				url:itemDetailUrl + "&id=" + id + "&defindex=" + defindex + "&quality_id=" + quality_id,
				render:itemDetailRender
			});
		}else{
			$(this).find(".item-detail").fadeIn(100);
		}
	});
	$(document).on("mouseleave",".item-box",function(){
		$(this).data("over","false");
		$(this).find(".item-detail").hide();
	});
	
	$.fn.loadItemDetail = function(config){
	    config = config||{};
	    var _this = this,
	        url = config.url,
	        render = config.render;
	    $.get(url,function(json){
	    	if(json.status=="failed"){
	    		$(_this).parent(".item-box").removeClass("loading");
	    	}else{
	    		var data = json.result;
	        	loadHtml(data);
	    	}
		});
	    function loadHtml(data){
	        var html = render({
	            result : data
	        });
			$(_this).parent(".item-box").addClass("load");
	        html&&$(_this).append(html);
	        if($(_this).parent(".item-box").data("over")=="true"){
	        	$(_this).fadeIn(100);
	        }
	    }
	};
});

/* back to top */
$(function(){
	var $top = $(".back-to-top");
	$(window).scroll(function(){
		if($(window).scrollTop() > 100){
			$top.removeClass("hide").stop().animate({opacity:1},300);
		}else{
			$top.stop().animate({opacity:0},300,function(){
				$(this).addClass("hide");
			});
		}
	});
	$top.click(function(){
		$("html,body").animate({scrollTop:0},500);
		return false;
	});
});

_DOTAMAX = {};
_DOTAMAX.getUrlParam = function(url,keepStr){
    var i = url.indexOf("?"),
        str,paramArr,paramObj={};
    str = i>=0?url.substr(i+1):"";
    if(keepStr)return str;
    paramArr = str.split("&");
    paramArr.forEach(function(val){
        var arr = val.split("=");
        paramObj[arr[0]]=arr[1];
    });
    return paramObj;
};



