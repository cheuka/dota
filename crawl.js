var fs = require('fs');
var request = require('superagent');
var atob = require('atob'); // For d3 decode

// Settings
var request_delay = 1234;
var next_request = 0;


var team_id = "1375614";

// ============================================= Foreach Team =============================================
getMatchList(team_id, 1, [], function(matches){
  for(var i=0;i<matches.length; i++){
    getMatch(matches[i].matchid, function(info){
      matches[i].info = info;
      getMatchLog(matches[i].matchid, function(logs){
        matches[i].logs = logs;

        fs.writeFile("../data.json", JSON.stringify(matches, null, 2), function(err) {
            console.log("The file was saved!");
        });
      });
    });

    break;  // FIXME load one match for developement
  }
});

function readtime(t){
  var m = /^(-)?(([0-9]+):)?([0-9]+):([0-9]+)$/ig.exec(t);
  return (m[3]?parseInt(m[3])*3600+parseInt(m[4])*60+parseInt(m[5]):parseInt(m[4])*60+parseInt(m[5])) * (m[1]=='-'?-1:1);
}

// ============================================= Get Logs of Match =============================================
function getMatchLog(matchid, callback){
  var link = "http://www.dotabuff.com/matches/"+matchid+"/log";
  get(link, function(html){
    try{
      var t = [];
      var m;

      // ====================== Get logs ======================
      var log_html = html.match(/<article class="filterable collapsible">([\s\S]+?)<\/article>/ig);
      log_html = log_html[0].match(/<div class="line">[\s\S]+?<\/div><\/div><\/div>/ig);

      for(var i=0; i<log_html.length; i++){
        t[i] = {};
        m = /<span class="time">([0-9:-]+)<\/span>/ig.exec(log_html[i]);
        t[i].time = readtime(m[1]);
        t[i].time_text = m[1];

        if(m = /<(a|span) class="object (color-faction-([^"]+))?(rune-([^"]+))?"/i.exec(log_html[i])){
          t[i].side = typeof m[3]!="undefined"?m[3]:m[4];
        }else{
          t[i].side = null;
        }

        m = /<div class="event">([\s\S]+)$/ig.exec(log_html[i]);
        t[i].text = m[1]
          .replace(/<div class="expandable"[^>]+>[\s\S]+?<\/div>/ig, '')
          .replace(/<a class="object color-faction-[^"]+"[^>]+><img alt="([^"]+)"[^>]+>/ig, '[$1]')
          .replace(/<[^>]+>/ig, '')
          .replace(/ +/ig, ' ')
          .trim();

        if(m = /<span class="map-item ([^ ]+) faction-([^"]+)" style="left: ([0-9]+)%; top: ([0-9]+)%;"><\/span>/ig.exec(log_html[i])){
          t[i].map = {
            item: m[1],
            side: m[2],
            left: m[3],
            top: m[4]
          };
        }
      }
console.log(t);
      callback(t);
    }catch(e){
      console.error("Error getting match data:\n"+e);
      callback(false);
    }
  });
}

// ============================================= Get Info of Match =============================================
function getMatch(matchid, callback){
  var link = "http://www.dotabuff.com/matches/"+matchid;
  get(link, function(html){
    try{
      var t = [];
      var m;

      // ====================== Get player info ======================
      var teams_results = html.match(/<div class="team-results">([\s\S]+?)<section><header>Net Worth Advantage/ig);
      teams_results = teams_results[0].match(/<section class="(radiant|dire)">([\s\S]+?)<\/section>/ig);

      for(var i=0; i<2; i++){
        t[i] = {};
        m = /<a href="\/esports\/teams\/([0-9]+)">([^>]+)<\/a>/ig.exec(teams_results[i]);
        t[i].teamid = m[1];
        t[i].teamname = m[2];

        m = /<section class="(radiant|dire)">([\s\S]+?)<\/section>/ig.exec(teams_results[i]);
        t[i].side = m[1];

        // foreach player:
        var players = teams_results[i].match(/<tr[^>]*>([\s\S]+?)<\/tr>/ig);
        t[i].player = [];
        for(var j=2; j<players.length; j++){
          if(m = /<a class="link-type-player" href="\/players\/([0-9]+)">([^>]+)<\/a>/ig.exec(players[j])){
          }else{
            continue;
          }
          t[i].player[j-2] = {};
          t[i].player[j-2].playerid = m[1];
          t[i].player[j-2].playername = m[2];

          m = /<div class="color-faction-[^"]+">([^<]+)<\/div>/ig.exec(players[j]);
          t[i].player[j-2].hero = m[1];
        }
      }

      // ====================== Get Net worth info ======================
      m = /<article class="highcharts-with-annotations"><div style="height: 300px" data-highchart="yes" data-encoded="([^"]+)" data-annotated="true">/ig.exec(html);
      encoded = m[1].replace(/&amp;/ig, "&");
      var chart_object = d3g.decode(encoded);
      var chart_data = chart_object.series[0].data;
      t.advantage = [];
      for(var i=0; i<chart_data.length; i++){
        t.advantage[i] = chart_data[i][1];
      }

      callback(t);
    }catch(e){
      console.error("Error getting match data:\n"+e);
      callback(false);
    }
  });
}

// ============================================= Get List of Matches =============================================
function getMatchList(team_id, page, results, callback){
  if(typeof results == "undefined") results = [];

  var link = "http://www.dotabuff.com/esports/teams/"+team_id+"/matches"+(page>1?"?page="+page:"");
  get(link, function(html){
    try {
      var matches = html.match(/<table class="table table-striped recent-esports-matches">([\s\S]+)<\/table>/ig);
      matches = matches[0].match(/<tr>([\s\S]+?)<\/tr>/ig);

      for(var i=1; i<matches.length; i++){
        var t = {};  // this match
        var m;

        m = /<a class="(won|lost)" href="\/matches\/([0-9]+)">/ig.exec(matches[i]);
        t.matchid = m[2];
        t.status = m[1];

        m = /<td class="r-none-mobile">([0-9:-]+)</ig.exec(matches[i]);
        t.duration = readtime(m[1]);
        t.duration_text = m[1];

        results.push(t);
      }

      if(html.match(/<a rel="next" href="[^"]+">Next &rsaquo;<\/a>/ig)){
        page++;
        if(page>=2) return callback(results); // FIXME load one page for developement
        getMatchList(team_id, page, callback, results);
      }
    }catch(e){
      console.error("Error getting match list:\n"+e);
      callback(false);
    }
  });
}

// ============================================= Delayed Crawling =============================================
function get(link, callback){
  next_request += request_delay;

  console.log("Requested (delay "+next_request+"): "+link);
  setTimeout(function(){
    request
      .get(encodeURI(link))
      .set('User-Agent','Mozilla/5.0 (X11; Linux x86_64; rv:12.0) Gecko/20100101 Firefox/12.0')
      .set('Accept', 'text/html')
      .end(function(err, res){
        console.log("Request Done: "+link);
        callback(res.text);
      }).on('error', function(error){
        console.warn("Error on link "+link+":\n"+error);
        return false;
      });

      next_request -= request_delay;
  }, next_request);
}

// ============================================= D3 Decoding Engine =============================================
var d3g = {
        makeJsonDecoder: function() {
            return JSON.parse;
        },
        stringReverse: function(t) {
            if ("[object String]" != Object.prototype.toString.call(t)) {
                return t.reverse();
            }
            for (var e = [], n = 0; n < t.length; n++) {
                if (n + 1 < t.length) {
                    var i = t.charCodeAt(n),
                        r = t.charCodeAt(n + 1);
                    if (i >= 55296 && 56319 >= i && 56320 == (64512 & r) || r >= 768 && 879 >= r) {
                        e.unshift(t.substring(n, n + 2)), n++;
                        continue;
                    }
                }
                e.unshift(t[n]);
            }
            return e.join("");
        },
        decodeNewlineRegex: function() {
            var t = "(";
            t += "]", t += ".", t += "}", t += ".", t += "&", t += ".", t += "@", t += ".", t += "#", t += ".", t += "\\$", t += ".", t += "\\*", t += ")", t = t.replace(/\./g, "|");
            var e = new RegExp(t, "g");
            return e;
        },
        decode: function(t) {

            return this.decodeEncodedA(t);
        },
        decodeEncodedA: function(t) {
            var e = "",
                n = t.length + t.length / 2 - t.length / 4,
                i = Math.acos(n),
                r = this.decodeNewlineRegex();
            return this.decodeEncodedB(t.replace(r, e), i);
        },
        decodeEncodedB: function(t, e) {
            var n = "=",
                i = t.length + t.length / 3 - t.length / 6 * e,
                r = Math.asin(i);
            return this.decodeEncodedC(t.replace(/\[/g, n), r);
        },
        decodeEncodedC: function(t, e) {
            var n = "";
            t = t.split(n);
            var i = t.length + t.length / 4 - t.length / 8 * e;
            t = t.reverse();
            var r = Math.acos(i);
            return t = t.join(n), this.decodeEncodedD(t, r);
        },
        decodeEncodedD: function(t, e) {
            var n = t.length + t.length / 5 - t.length / 10 * e,
                i = Math.asin(n);
            return this.decodeEncodedE(atob(t), i);
        },
        decodeEncodedE: function(t, e) {
            var n = "";
            t = t.split(n);
            var i = t.length + t.length / 6 - t.length / 12 * e;
            t = this.stringReverse(t);
            var r = Math.log(i);
            return t = t.join(n), this.decodeEncodedF(t, r);
        },
        decodeEncodedF: function(t, e) {
            {
                var n = this.makeJsonDecoder(),
                    i = t.length + t.length / 8 - t.length / 16 * e;
                Math.log(i);
            }
            return n(t);
        }
    };
