/* cookie */
function setCookie(name, value) {
    var Days = 5; 
    var exp = new Date();
    exp.setTime(exp.getTime() + Days * 24 * 60 * 60 * 1000);
    document.cookie = name + "=" + escape(value) + ";expires=" + exp.toGMTString();
}

function delCookie(name) {
    var exp = new Date();
    exp.setTime(exp.getTime() - 1);
    var cval = getCookie(name);
    if (cval != null) document.cookie = name + "=" + cval + ";expires=" + exp.toGMTString();
}

function getCookie(name) {
    var arr = document.cookie.match(new RegExp("(^| )" + name + "=([^;]*)(;|$)"));
    if (arr != null)
        return unescape(arr[2]);
    return null;
}
/*open div_box*/


function AddFavorite(sURL, sTitle) {
    try {
        window.external.addFavorite(sURL, sTitle);
    } catch (e) {
        try {
            window.sidebar.addPanel(sTitle, sURL, "");
        } catch (e) {
            alert("您的浏览器不支持自动加入收藏，请使用“Ctrl+D”手动进行添加");
        }
    }
}

function limit() {
    var self = $("[limit]");
    self.each(function() {
        var objString = $(this).text();
        var objLength = $(this).text().length;
        var num = $(this).attr("limit");
        if (objLength > num) {
            $(this).attr("title", objString);
            objString = $(this).text(objString.substring(0, num) + "...");
        }
    })
}

var EV_MsgBox_ID = "";

function EV_modeAlert(msgID) {
    var bgObj = document.createElement("div");
    bgObj.setAttribute('id', 'EV_bgModeAlertDiv');
    document.body.appendChild(bgObj);
    EV_Show_bgDiv();
    EV_MsgBox_ID = msgID;
    EV_Show_msgDiv();
    loadFilterAJAX('', "none");
    $(".hero-list-filter").hide();
}

function EV_closeAlert() {
    var msgObj = document.getElementById(EV_MsgBox_ID);
    var bgObj = document.getElementById("EV_bgModeAlertDiv");
    msgObj.style.display = "none";
    document.body.removeChild(bgObj);
    EV_MsgBox_ID = "";
}

/*
window.onresize = function() {
    if (EV_MsgBox_ID.length > 0) {
        EV_Show_bgDiv();
        EV_Show_msgDiv();
    }
}

window.onscroll = function() {
    if (EV_MsgBox_ID.length > 0) {
        EV_Show_bgDiv();
        EV_Show_msgDiv();
    }
}
*/

function EV_Show_msgDiv() {
    var msgObj = document.getElementById(EV_MsgBox_ID);
    msgObj.style.display = "block";
    var msgWidth = msgObj.scrollWidth;
    var msgHeight = msgObj.scrollHeight;
    var bgTop = EV_myScrollTop();
    var bgLeft = EV_myScrollLeft();
    var bgWidth = EV_myClientWidth();
    var bgHeight = EV_myClientHeight();
    var msgTop = bgTop + Math.round((bgHeight - msgHeight) / 2);
    var msgLeft = bgLeft + Math.round((bgWidth - msgWidth) / 2);
    msgObj.style.position = "absolute";
    msgObj.style.top = "50px";
    msgObj.style.left = msgLeft + "px";
    msgObj.style.zIndex = "1001";
}

function EV_Show_bgDiv() {
    var bgObj = document.getElementById("EV_bgModeAlertDiv");
    var bgWidth = EV_myClientWidth();
    var bgHeight = EV_myClientHeight();
    var bgTop = EV_myScrollTop();
    var bgLeft = EV_myScrollLeft();
    bgObj.style.position = "fixed";
    bgObj.style.top = bgTop + "px";
    bgObj.style.left = bgLeft + "px";
    bgObj.style.width = bgWidth + "px";
    bgObj.style.height = bgHeight + "px";
    bgObj.style.zIndex = "1000";
    bgObj.style.background = "#555";
    bgObj.style.filter = "progid:DXImageTransform.Microsoft.Alpha(style=0,opacity=60,finishOpacity=60);";
    bgObj.style.opacity = "0.6";
}

function EV_myScrollTop() {
    var n = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    return n;
}

function EV_myScrollLeft() {
    var n = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
    return n;
}

function EV_myClientWidth() {
    var n = document.documentElement.clientWidth || document.body.clientWidth || 0;
    return n;
}

function EV_myClientHeight() {
    var n = document.documentElement.clientHeight || document.body.clientHeight || 0;
    return n;
}

/* matches */
function DoNav(theUrl) {
    document.location.href = theUrl;
}

function OpenNav(theUrl) {
    window.open(theUrl);
}

var xmlhttp;

function DoNavAJAX(url) {
    xmlhttp = null;
    if (window.XMLHttpRequest) { // code for all new browsers
        xmlhttp = new XMLHttpRequest();
    } else if (window.ActiveXObject) { // code for IE5 and IE6
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    if (xmlhttp != null) {
        xmlhttp.onreadystatechange = state_Change;
        xmlhttp.open("GET", url, true);
        xmlhttp.send(null);
        alert("成功");
    } else {
        alert("Your browser does not support XMLHTTP.");
    }
}


function RecentMatchAJAX(url, level) {
    var xmlhttp;
    if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } else { // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4) {
            if (xmlhttp.status == 200) {
                document.getElementById("ajax_matches").innerHTML = xmlhttp.responseText;
            } else {
                if (xmlhttp.status == 203) {} else {
                    if (level < 3) {
                        setTimeout("RecentMatchAJAX('" + url + "'," + (level + 1) + ")", 1500);
                    } else {
                        if (level == 3) {
                            setTimeout("RecentMatchAJAX('" + url + "'," + (level + 1) + ")", 3000);
                        } else {
                            document.getElementById("ajax_update_info").innerHTML = '仍在更新，请稍后刷新';
                        }
                    }
                }
            }
        }

    }
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}


function FollowAJAX(url) {
    var xmlhttp;
    if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } else { // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function() {
        document.getElementById("ajax_box").innerHTML = '处理中';
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            document.getElementById("ajax_box").innerHTML = xmlhttp.responseText;
        }
    }

    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}

function test_xml() {
    alert(xmlhttp.status);
}

function state_Change() {
    if (xmlhttp.readyState == 4) { // 4 = "loaded"
        if (xmlhttp.status == 200) {;
        } else {;
        }
    }
}

function DoMatchNav(theUrl) {
    document.location.href = theUrl;
}

function DoNav_player() {
    document.location.href = document.location.href = '/player/detail/' + $("#id-input").val();;
}

function DoNav_match() {
    document.location.href = document.location.href = '/match/detail/' + $("#id-input").val();;
}

function DoNav_match_close() {
    document.location.href = document.location.href = '/match/';
}

function DoNav_player_close() {
        document.location.href = document.location.href = '/player/';
    }
    /* filter */
function getUrlVars() {
    var vars = [],
        hash;
    if (window.location.href.indexOf('?') == -1) {
        return vars;
    }
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');

    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }

    return vars;
}

function loadFilterhero(hero_type) {
    $(".f-hero").removeClass("active");
    var caller = event.srcElement;
    $(caller).addClass("active");
    switch (hero_type) {
        case "f-str":
            {
                $(".hero-list-filter").hide();
                $("#f-str").slideDown();
                break;
            }
        case "f-agi":
            {
                $(".hero-list-filter").hide();
                $("#f-agi").slideDown();
                break;
            }
        case "f-int":
            {
                $(".hero-list-filter").hide();
                $("#f-int").slideDown();
                break;
            }
        case "f-all":
            {
                $(".hero-list-filter").hide();
                break;
            }
        default:
            {
                break;
            }
    }
}

var f_rarity = "";
var f_prefab = "";
var f_hero = "";
var f_page = "";
var f_order = "";
var AJAX_url = "/econ_items/filtered_page/";
var is_filter = "";

function loadFilterAJAX(filter_list, active_type) {
    if (active_type == "hero-filter") {
        $("." + active_type).removeClass("hero-filter-active");
        var caller = event.srcElement;
        $(caller).addClass("hero-filter-active");
    } else if (active_type == "none") {;
    } else {
        $("." + active_type).removeClass("active");
        var caller = event.srcElement;
        $(caller).addClass("active");
    }

    var xmlhttp;
    if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } else { // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function() {
        document.getElementById("ajax_box").innerHTML = '<div id="loading" class="loading">Loading pages...</div>  ';
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            document.getElementById("ajax_box").innerHTML = xmlhttp.responseText;
            Tooptips_init();
            $(".econ_item_small").click(function() {
                if (is_filter == "y") {
                    EV_closeAlert();
                    var base = GetUrlRelativePath()
                    document.location.href = base + "?item_id=" + $(this).attr("xid");

                } else {
                    if (typeof(trade_type) == "undefined") {
                        if (item_count < 8) {
                            item_count += 1;
                            $(".trade-container").append($(this).clone().attr("onclick", "$(this).remove();item_count -=1;").addClass("item-removable"));
                            $(".trade-container").find(".toolhidden").hide();
                            Tooptips_init();
                        }
                    } else {
                        if (trade_type == "b") {
                            if (item_want < 8) {
                                item_want += 1;
                                $(".trade-container").append($(this).clone().attr("onclick", "$(this).remove();item_want -=1;").addClass("item-removable"));
                                $(".trade-container").find(".toolhidden").hide();
                                Tooptips_init();
                            }
                        } else {
                            if (item_have < 8) {
                                item_have += 1;
                                $(".trade-container").append($(this).clone().attr("onclick", "$(this).remove();item_have -=1;").addClass("item-removable"));
                                $(".trade-container").find(".toolhidden").hide();
                                Tooptips_init();
                            }
                        }
                    }

                }

            });
        }
    }
    switch (active_type) {
        case "f-rarity":
            {
                f_rarity = filter_list;
                break;
            }
        case "f-prefab":
            {
                f_prefab = filter_list;
                break;
            }
        case "hero-filter":
            {
                f_hero = filter_list;
                break;
            }
        case "f-page":
            {
                f_page = filter_list;
                break
            }
        case "f-order":
            {
                f_order = filter_list;
                break;
            }
        default:
            {
                break;
            }
    }
    var url_filter = "";
    if (f_rarity != "") {
        if (url_filter == "") {
            url_filter += "?";
        } else {
            url_filter += "&";
        }
        url_filter += f_rarity;
    }
    if (f_prefab != "") {
        if (url_filter == "") {
            url_filter += "?";
        } else {
            url_filter += "&";
        }
        url_filter += f_prefab;
    }
    if (f_hero != "") {
        if (url_filter == "") {
            url_filter += "?";
        } else {
            url_filter += "&";
        }
        url_filter += f_hero;
    }
    if (f_page != "") {
        if (url_filter == "") {
            url_filter += "?";
        } else {
            url_filter += "&";
        }
        url_filter += f_page;
    }
    if (f_order != "") {
        if (url_filter == "") {
            url_filter += "?";
        } else {
            url_filter += "&";
        }
        url_filter += f_order;
    }
    xmlhttp.open("GET", AJAX_url + url_filter, true);
    xmlhttp.send();
}


function Tooptips_init() {
    /* CONFIG */
    xOffset = 20;
    yOffset = 20;
    /* END CONFIG */

    $(".maxtooltip").mousemove(function(e) {
        if (e.pageX < '380') {
            $(this).children(".toolhidden")
                .css("margin-left", "0px");
        }
        if (e.pageX > '1050') {
            $(this).children(".toolhidden")
                .css("margin-left", "-190px");
        }
        if (e.pageY > ($(this).children(".toolhidden").height() + 80)) {
            $(this).children(".toolhidden")
                .css("margin-top", -($(this).children(".toolhidden").height() + 50) + "px")
        } else {
            $(this).children(".toolhidden")
                .css("margin-top", "60px")
        }
        $(this).children(".toolhidden").show()
    });
    $(".maxtooltip").mouseout(function(e) {
        $(this).children(".toolhidden").hide();

    });
};

function GoToTop(caller) {
    var pos = $(caller).offset().top; //获取该点到头部的距离
    $("html,body").animate({
        scrollTop: 100
    }, 300);
    $("html,body").animate({
        scrollTop: 0
    }, 150);
}

function GetUrlRelativePath() {
    var url = document.location.toString();
    var arrUrl = url.split("//");

    var start = arrUrl[1].indexOf("/");
    var relUrl = arrUrl[1].substring(start);

    if (relUrl.indexOf("?") != -1) {
        relUrl = relUrl.split("?")[0];
    }
    return relUrl;
}

function FilterNav(filtertype, tvalue) {
    var base = GetUrlRelativePath()
    var para = getUrlVars();
    var first = 0
    var value = ""
    if (filtertype == "time")
        value = $('#filtertime option:selected').val();
    if (filtertype == "server")
        value = $('#filterserver option:selected').val();
    if (filtertype == "hero")
        value = $('#filterhero option:selected').val();
    if (filtertype == "item_rarity")
        value = $('#item_rarity option:selected').val();
    if (filtertype == "item_slot")
        value = $('#item_slot option:selected').val();
    if (filtertype == "skill")
        value = tvalue;
    if (filtertype == "ladder")
        value = tvalue;

    if (para.hasOwnProperty(filtertype)) {
        para[filtertype] = value;
    } else {
        para.push(filtertype);
        para[filtertype] = value;
    }

    for (var i = 0; i < para.length; i++) {
        if (para[i] == "item_rarity" || para[i] == "item_slot" || para[i] == "time" || para[i] == "server" || para[i] == "team_id" || para[i] == "skill" || para[i] == "ladder" || para[i] == "hero") {
            if (i > 0 && first != 0) {
                base += '&';
            }
            if (first == 0) {
                base += "?";
                first = 1;
            }
            base += (para[i] + '=' + para[para[i]]);
        }
    }

    document.location.href = base;
}

function Ads_Choice() {
    var uagent = navigator.userAgent.toLowerCase();

    if (uagent.search("iphone") > -1 || uagent.search("android") > -1 || Math.floor((Math.random() * 10) + 1) > 7)
        $("#pc_ads").hide();
    else
        $("#mobile_ads").hide();
    //window.open('http://gamedown.sp.cc/LittleGame_Channel2005.apk');
}



/************
 * document ready function!
 */

$(document).ready(function() {
    if ((navigator.userAgent.match(/(Android|android)/i))) {
        androidFlag = getCookie('androidHide');
        if (androidFlag != 'True') {
            $("#android_app").show();
        }
    }
    $("[title]").tooltip({

        // make fadeOutSpeed similar to the browser's default
        fadeOutSpeed: 100,

        // the time before the tooltip is shown
        predelay: 100,
        // tweak the position
        position: "top center",
        opacity: 0.85,
        offset: [-10, 0]

    });
    $("#dotamaxad").delay(16000).hide(0);
    $('input[placeholder]').each(function() {
        var input = $(this);
        $(input).val(input.attr('placeholder'));

        $(input).focus(function() {
            if (input.val() == input.attr('placeholder')) {
                input.val('');
            }
        });

        $(input).blur(function() {
            if (input.val() == '' || input.val() == input.attr('placeholder')) {
                input.val(input.attr('placeholder'));
            }
        });
    });

    /* match list hover link*/
    $("#id-input").keydown(function(event) {
        if (event.keyCode == 13) {
            document.location.href = '/match/detail/' + $("#id-input").val();

        }
    })
    var para = getUrlVars();

    $("#filtertime").val(para["time"]);
    $("#filterserver").val(para["server"]);
    $("#filterskill").val(para["skill"]);
    $("#filterladder").val(para["ladder"]);
    /* fliter */

    switch (para["time"]) {
        case "month":
            {
                $("#droptime #title").text("本月数据");
                break;
            }
        case "week":
            {
                $("#droptime #title").text("本周数据");
                break;
            }
        case "v679":
            {
                $("#droptime #title").text("6.79版本数据");
                break;
            }
        case "v680":
            {
                $("#droptime #title").text("6.80版本数据");
                break;
            }
        case "v678c":
            {
                $("#droptime #title").text("6.78c版本数据");
                break;
            }
        case "v678":
            {
                $("#droptime #title").text("6.78版本数据");
                break;
            }
        case "v677":
            {
                $("#droptime #title").text("6.77版本数据");
                break;
            }
        case "v676":
            {
                $("#droptime #title").text("6.76版本数据");
                break;
            }
        case "all":
            {
                $("#droptime #title").text("全部数据");
                break;
            }
        default:
            {
                $("#droptime #title").text("本月数据");
            }
    }
    switch (para["server"]) {
        case "all":
            {
                $("#dropserver #title").text("全部服务器");
                break;
            }
        case "cn":
            {
                $("#dropserver #title").text("完美服务器");
                break;
            }
        case "world":
            {
                $("#dropserver #title").text("世界服务器");
                break;
            }
        default:
            {
                $("#dropserver #title").text("全部服务器");
            }
    }
    switch (para["skill"]) {
        case "all":
            {
                $("#filterskill-all").addClass('active');
                break;
            }
        case "pro":
            {
                $("#filterskill-pro").addClass('active');
                break;
            }
        case "vh":
            {
                $("#filterskill-vh").addClass('active');
                break;
            }
        case "h":
            {
                $("#filterskill-h").addClass('active');
                break;
            }
        case "n":
            {
                $("#filterskill-n").addClass('active');
                break;
            }
        default:
            {
                $("#filterskill-all").addClass('active');
            }
    }
    switch (para["ladder"]) {
        case "all":
            {
                $("#filterladder-all").addClass('active');
                break;
            }
        case "y":
            {
                $("#filterladder-yes").addClass('active');
                break;
            }
        case "n":
            {
                $("#filterladder-no").addClass('active');
                break;
            }
        case "solo":
            {
                $("#filterladder-solo").addClass('active');
                break;
            }
        default:
            {
                $("#filterladder-all").addClass('active');
            }
    }

    /* scoller to top */



    /* bootstrap select init */
    $('.selectpicker').selectpicker();

    /* moment js init */
    moment().format();
    moment().fromNow();
    moment.lang('en', {
        relativeTime: {
            future: "刚刚",
            past: "%s前",
            s: "几秒",
            m: "一分钟",
            mm: "%d分钟",
            h: "1小时",
            hh: "%d小时",
            d: "一天",
            dd: "%d天",
            M: "一个月",
            MM: "%d个月",
            y: "一年",
            yy: "%d年"
        }
    });


    $(".f1romnow").each(function() {
        var htmlString = $(this).html();
        htmlString = moment(htmlString, "MMMM DD, YYYY, h:mm a").fromNow();
        $(this).text(htmlString);
    });

    $("#contents").show(0);
    $("#loading").hide(0);
    Tooptips_init();
});



! function(t, e, n) {
    "use strict";

    function r(t) {
        var e = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        t = t.replace(e, function(t, e, n, r) {
            return e + e + n + n + r + r
        });
        var n = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(t);
        return n ? [parseInt(n[1], 16), parseInt(n[2], 16), parseInt(n[3], 16)] : null
    }

    function i(t, e, n, r) {
        return Math.round(n + (r - n) * t / e)
    }

    function a(t, e, n, a, o) {
        var l = -1 != o.indexOf("#") ? r(o) : o.match(/\d+/g),
            u = -1 != a.indexOf("#") ? r(a) : a.match(/\d+/g),
            s = n - e,
            h = t - e;
        return l && u ? "rgb(" + i(h, s, u[0], l[0]) + "," + i(h, s, u[1], l[1]) + "," + i(h, s, u[2], l[2]) + ")" : null
    }

    function o() {
        for (var t = arguments, e = t[0], n = 1, r = t.length; r > n; n++) {
            var i = t[n];
            for (var a in i) i.hasOwnProperty(a) && (e[a] = i[a])
        }
        return e
    }

    function l(t) {
        return function(e) {
            if (!t) return e.toString();
            e = e || 0;
            for (var n = e.toString().split("").reverse(), r = t.split("").reverse(), i = 0, a = 0, o = r.length; o > i && n.length; i++) "#" == r[i] && (a = i, r[i] = n.shift());
            return r.splice(a + 1, r.lastIndexOf("#") - a, n.reverse().join("")), r.reverse().join("")
        }
    }

    function u(t, e) {
        e = e || {}, e = o({}, s.defaults, e), this.indOption = e, "string" == typeof t && (t = n.querySelector(t)), t.length && (t = t[0]), this.container = t;
        var r = n.createElement("canvas");
        t.appendChild(r), this.canElm = r, this.ctx = r.getContext("2d"), this.current_value = e.initValue || e.minValue || 0
    }

    function s(t, e) {
        var n = new u(t, e);
        return n._init(), n
    }
    var h = 2 * Math.PI,
        c = Math.PI / 2,
        f = function() {
            var t = n.createElement("canvas").getContext("2d"),
                r = e.devicePixelRatio || 1,
                i = t.webkitBackingStorePixelRatio || t.mozBackingStorePixelRatio || t.msBackingStorePixelRatio || t.oBackingStorePixelRatio || t.backingStorePixelRatio || 1,
                a = r / i;
            return function(t, e, r) {
                var i = r || n.createElement("canvas");
                return i.width = t * a, i.height = e * a, i.style.width = t + "px", i.style.height = e + "px", i.getContext("2d").setTransform(a, 0, 0, a, 0, 0), i
            }
        }();
    u.prototype = {
        constructor: s,
        _init: function() {
            var t = this.indOption,
                e = this.canElm,
                n = (this.ctx, 2 * (t.radius + t.barWidth));
            return this.formatter = "function" == typeof t.format ? t.format : l(t.format), this.maxLength = t.percentage ? 4 : this.formatter(t.maxValue).length, f(n, n, e), this._drawBarBg(), this.value(this.current_value), this
        },
        _drawBarBg: function() {
            var t = this.indOption,
                e = this.ctx,
                n = 2 * (t.radius + t.barWidth),
                r = n / 2;
            e.strokeStyle = t.barBgColor, e.lineWidth = t.barWidth, "transparent" != t.barBgColor && (e.beginPath(), e.arc(r, r, t.radius - 1 + t.barWidth / 2, 0, 2 * Math.PI), e.stroke())
        },
        value: function(t) {
            if (void 0 === t || isNaN(t)) return this.current_value;
            t = parseInt(t);
            var e = this.ctx,
                n = this.indOption,
                r = n.barColor,
                i = 2 * (n.radius + n.barWidth),
                o = n.minValue,
                l = n.maxValue,
                u = i / 2;
            t = o > t ? o : t > l ? l : t;
            var s = Math.round(100 * (t - o) / (l - o) * 100) / 100,
                f = n.percentage ? s + "%" : this.formatter(t);
            if (this.current_value = t, e.clearRect(0, 0, i, i), this._drawBarBg(), "object" == typeof r)
                for (var d = Object.keys(r), v = 1, m = d.length; m > v; v++) {
                    var g = d[v - 1],
                        p = d[v],
                        x = r[g],
                        b = r[p],
                        C = t == g ? x : t == p ? b : t > g && p > t ? n.interpolate ? a(t, g, p, x, b) : b : !1;
                    if (0 != C) {
                        r = C;
                        break
                    }
                }
            if (e.strokeStyle = r, n.roundCorner && (e.lineCap = "round"), e.beginPath(), e.arc(u, u, n.radius - 1 + n.barWidth / 2, -c, h * s / 100 - c, !1), e.stroke(), n.displayNumber) {
                var y = e.font.split(" "),
                    B = n.fontWeight,
                    I = n.fontSize || i / (this.maxLength - (Math.floor(1.4 * this.maxLength / 4) - 1));
                y = n.fontFamily || y[y.length - 1], e.fillStyle = n.fontColor || r, e.font = B + " " + I + "px " + y, e.textAlign = "center", e.textBaseline = "middle", e.fillText(f, u, u)
            }
            return this
        },
        animate: function(t) {
            var e = this.indOption,
                n = this.current_value || e.minValue,
                r = this,
                i = e.minValue,
                a = e.maxValue,
                o = Math.ceil((a - i) / (e.frameNum || (e.percentage ? 100 : 500)));
            t = i > t ? i : t > a ? a : t;
            var l = n > t;
            return this.intvFunc && clearInterval(this.intvFunc), this.intvFunc = setInterval(function() {
                if (!l && n >= t || l && t >= n) {
                    if (r.current_value == n) return clearInterval(r.intvFunc), void(e.onAnimationComplete && e.onAnimationComplete(r.current_value));
                    n = t
                }
                r.value(n), n != t && (n += l ? -o : o)
            }, e.frameTime), this
        },
        option: function(t, e) {
            return void 0 === e ? this.option[t] : (-1 != ["radius", "barWidth", "barBgColor", "format", "maxValue", "percentage"].indexOf(t) && (this.indOption[t] = e, this._init().value(this.current_value)), void(this.indOption[t] = e))
        }
    }, s.defaults = {
        radius: 50,
        barWidth: 5,
        barBgColor: "#eeeeee",
        barColor: "#99CC33",
        format: null,
        frameTime: 10,
        frameNum: null,
        fontColor: null,
        fontFamily: null,
        fontWeight: "bold",
        fontSize: null,
        interpolate: !0,
        percentage: !1,
        displayNumber: !0,
        roundCorner: !1,
        minValue: 0,
        maxValue: 100,
        initValue: 0
    }, e.radialIndicator = s, t && (t.fn.radialIndicator = function(e) {
        return this.each(function() {
            var n = s(this, e);
            t.data(this, "radialIndicator", n)
        })
    })
}(window.jQuery, window, document, void 0);
(function(a) {
    a.tools = a.tools || {
        version: "v1.2.7"
    }, a.tools.tooltip = {
        conf: {
            effect: "toggle",
            fadeOutSpeed: "fast",
            predelay: 0,
            delay: 30,
            opacity: 1,
            tip: 0,
            fadeIE: !1,
            position: ["top", "center"],
            offset: [0, 0],
            relative: !1,
            cancelDefault: !0,
            events: {
                def: "mouseenter,mouseleave",
                input: "focus,blur",
                widget: "focus mouseenter,blur mouseleave",
                tooltip: "mouseenter,mouseleave"
            },
            layout: "<div/>",
            tipClass: "tooltip"
        },
        addEffect: function(a, c, d) {
            b[a] = [c, d]
        }
    };
    var b = {
        toggle: [function(a) {
            var b = this.getConf(),
                c = this.getTip(),
                d = b.opacity;
            d < 1 && c.css({
                opacity: d
            }), c.show(), a.call()
        }, function(a) {
            this.getTip().hide(), a.call()
        }],
        fade: [function(b) {
            var c = this.getConf();
            !a.browser.msie || c.fadeIE ? this.getTip().fadeTo(c.fadeInSpeed, c.opacity, b) : (this.getTip().show(), b())
        }, function(b) {
            var c = this.getConf();
            !a.browser.msie || c.fadeIE ? this.getTip().fadeOut(c.fadeOutSpeed, b) : (this.getTip().hide(), b())
        }]
    };

    function c(b, c, d) {
        var e = d.relative ? b.position().top : b.offset().top,
            f = d.relative ? b.position().left : b.offset().left,
            g = d.position[0];
        e -= c.outerHeight() - d.offset[0], f += b.outerWidth() + d.offset[1], /iPad/i.test(navigator.userAgent) && (e -= a(window).scrollTop());
        var h = c.outerHeight() + b.outerHeight();
        g == "center" && (e += h / 2), g == "bottom" && (e += h), g = d.position[1];
        var i = c.outerWidth() + b.outerWidth();
        g == "center" && (f -= i / 2), g == "left" && (f -= i);
        return {
            top: e,
            left: f
        }
    }

    function d(d, e) {
        var f = this,
            g = d.add(f),
            h, i = 0,
            j = 0,
            k = d.attr("title"),
            l = d.attr("data-tooltip"),
            m = b[e.effect],
            n, o = d.is(":input"),
            p = o && d.is(":checkbox, :radio, select, :button, :submit"),
            q = d.attr("type"),
            r = e.events[q] || e.events[o ? p ? "widget" : "input" : "def"];
        if (!m) throw "Nonexistent effect \"" + e.effect + "\"";
        r = r.split(/,\s*/);
        if (r.length != 2) throw "Tooltip: bad events configuration for " + q;
        d.on(r[0], function(a) {
            clearTimeout(i), e.predelay ? j = setTimeout(function() {
                f.show(a)
            }, e.predelay) : f.show(a)
        }).on(r[1], function(a) {
            clearTimeout(j), e.delay ? i = setTimeout(function() {
                f.hide(a)
            }, e.delay) : f.hide(a)
        }), k && e.cancelDefault && (d.removeAttr("title"), d.data("title", k)), a.extend(f, {
            show: function(b) {
                if (!h) {
                    l ? h = a(l) : e.tip ? h = a(e.tip).eq(0) : k ? h = a(e.layout).addClass(e.tipClass).appendTo(document.body).hide().append(k) : (h = d.next(), h.length || (h = d.parent().next()));
                    if (!h.length) throw "Cannot find tooltip for " + d
                }
                if (f.isShown()) return f;
                h.stop(!0, !0);
                var o = c(d, h, e);
                e.tip && h.html(d.data("title")), b = a.Event(), b.type = "onBeforeShow", g.trigger(b, [o]);
                if (b.isDefaultPrevented()) return f;
                o = c(d, h, e), h.css({
                    position: "absolute",
                    top: o.top,
                    left: o.left
                }), n = !0, m[0].call(f, function() {
                    b.type = "onShow", n = "full", g.trigger(b)
                });
                var p = e.events.tooltip.split(/,\s*/);
                h.data("__set") || (h.off(p[0]).on(p[0], function() {
                    clearTimeout(i), clearTimeout(j)
                }), p[1] && !d.is("input:not(:checkbox, :radio), textarea") && h.off(p[1]).on(p[1], function(a) {
                    a.relatedTarget != d[0] && d.trigger(r[1].split(" ")[0])
                }), e.tip || h.data("__set", !0));
                return f
            },
            hide: function(c) {
                if (!h || !f.isShown()) return f;
                c = a.Event(), c.type = "onBeforeHide", g.trigger(c);
                if (!c.isDefaultPrevented()) {
                    n = !1, b[e.effect][1].call(f, function() {
                        c.type = "onHide", g.trigger(c)
                    });
                    return f
                }
            },
            isShown: function(a) {
                return a ? n == "full" : n
            },
            getConf: function() {
                return e
            },
            getTip: function() {
                return h
            },
            getTrigger: function() {
                return d
            }
        }), a.each("onHide,onBeforeShow,onShow,onBeforeHide".split(","), function(b, c) {
            a.isFunction(e[c]) && a(f).on(c, e[c]), f[c] = function(b) {
                b && a(f).on(c, b);
                return f
            }
        })
    }
    a.fn.tooltip = function(b) {
        var c = this.data("tooltip");
        if (c) return c;
        b = a.extend(!0, {}, a.tools.tooltip.conf, b), typeof b.position == "string" && (b.position = b.position.split(/,?\s/)), this.each(function() {
            c = new d(a(this), b), a(this).data("tooltip", c)
        });
        return b.api ? c : this
    }
})(jQuery);
(function(a) {
    var b = a.tools.tooltip;
    b.dynamic = {
        conf: {
            classNames: "top right bottom left"
        }
    };

    function c(b) {
        var c = a(window),
            d = c.width() + c.scrollLeft(),
            e = c.height() + c.scrollTop();
        return [b.offset().top <= c.scrollTop(), d <= b.offset().left + b.width(), e <= b.offset().top + b.height(), c.scrollLeft() >= b.offset().left]
    }

    function d(a) {
        var b = a.length;
        while (b--)
            if (a[b]) return !1;
        return !0
    }
    a.fn.dynamic = function(e) {
        typeof e == "number" && (e = {
            speed: e
        }), e = a.extend({}, b.dynamic.conf, e);
        var f = a.extend(!0, {}, e),
            g = e.classNames.split(/\s/),
            h;
        this.each(function() {
            var b = a(this).tooltip().onBeforeShow(function(b, e) {
                var i = this.getTip(),
                    j = this.getConf();
                h || (h = [j.position[0], j.position[1], j.offset[0], j.offset[1], a.extend({}, j)]), a.extend(j, h[4]), j.position = [h[0], h[1]], j.offset = [h[2], h[3]], i.css({
                    visibility: "hidden",
                    position: "absolute",
                    top: e.top,
                    left: e.left
                }).show();
                var k = a.extend(!0, {}, f),
                    l = c(i);
                if (!d(l)) {
                    l[2] && (a.extend(j, k.top), j.position[0] = "top", i.addClass(g[0])), l[3] && (a.extend(j, k.right), j.position[1] = "right", i.addClass(g[1])), l[0] && (a.extend(j, k.bottom), j.position[0] = "bottom", i.addClass(g[2])), l[1] && (a.extend(j, k.left), j.position[1] = "left", i.addClass(g[3]));
                    if (l[0] || l[2]) j.offset[0] *= -1;
                    if (l[1] || l[3]) j.offset[1] *= -1
                }
                i.css({
                    visibility: "visible"
                }).hide()
            });
            b.onBeforeShow(function() {
                var a = this.getConf(),
                    b = this.getTip();
                setTimeout(function() {
                    a.position = [h[0], h[1]], a.offset = [h[2], h[3]]
                }, 0)
            }), b.onHide(function() {
                var a = this.getTip();
                a.removeClass(e.classNames)
            }), ret = b
        });
        return e.api ? ret : this
    }
})(jQuery);
(function(a) {
    var b = a.tools.tooltip;
    a.extend(b.conf, {
        direction: "up",
        bounce: !1,
        slideOffset: 10,
        slideInSpeed: 200,
        slideOutSpeed: 200,
        slideFade: !a.browser.msie
    });
    var c = {
        up: ["-", "top"],
        down: ["+", "top"],
        left: ["-", "left"],
        right: ["+", "left"]
    };
    b.addEffect("slide", function(a) {
        var b = this.getConf(),
            d = this.getTip(),
            e = b.slideFade ? {
                opacity: b.opacity
            } : {},
            f = c[b.direction] || c.up;
        e[f[1]] = f[0] + "=" + b.slideOffset, b.slideFade && d.css({
            opacity: 0
        }), d.show().animate(e, b.slideInSpeed, a)
    }, function(b) {
        var d = this.getConf(),
            e = d.slideOffset,
            f = d.slideFade ? {
                opacity: 0
            } : {},
            g = c[d.direction] || c.up,
            h = "" + g[0];
        d.bounce && (h = h == "+" ? "-" : "+"), f[g[1]] = h + "=" + e, this.getTip().animate(f, d.slideOutSpeed, function() {
            a(this).hide(), b.call()
        })
    })
})(jQuery);

/*
    radialIndicator.js v 1.1.0
    Author: Sudhanshu Yadav
    Copyright (c) 2015 Sudhanshu Yadav - ignitersworld.com , released under the MIT license.
    Demo on: ignitersworld.com/lab/radialIndicator.html
*/

/* Angular hook for radialIndicator */
;
(function (angular) {
    angular.module('radialIndicator', []).directive('radialIndicator', ['radialIndicatorInstance',

    function (radialIndicatorInstance) {
            return {
                restrict: 'A',
                link: function (scope, element, attrs) {
                    var element = element,
                        id = attrs.radialIndicatorId,
                        options = scope.$eval(attrs.radialIndicator),
                        model = attrs.radialIndicatorModel;

                    var indInstance = radialIndicator(element, options);

                    //store indicator instance on radialIndicatorConfig so can get through dependency injection
                    if (id) radialIndicatorInstance[id] = indInstance;

                    //watch for modal change
                    scope.$watch(model, function (newValue) {
                        indInstance.value(newValue);
                    });

                    //delete the idnicator instance when scope dies
                    scope.$on('$destroy', function () {
                        if (id) delete radialIndicatorInstance[id];
                    });

                }
            }
    }])
    //a factory to store radial indicators instances which can be injected to controllers or directive to get any indicators instance
    .factory('radialIndicatorInstance', function () {
        if (!window.radialIndicator) throw "Please include radialIndicator.js";

        var radialIndicatorInstance = {};

        return radialIndicatorInstance;

    });
}(angular));
