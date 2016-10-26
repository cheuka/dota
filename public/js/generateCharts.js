window.generateChartsOn = function generateChartsOn(data, fights, matchUpload) {
    var color_array = [];
    color_array.push("#aec7e8");
    color_array.push("#FF0000");
    color_array.push("#0000FF");

    var fightPoint = getFightsPoint(data.difference, fights)
    var fightsStart = getFightsTime(fights);
    var difference = [data.difference[0], data.difference[2], fightPoint, fightsStart];

	var c1_legend = '经济曲线 （ 天辉 = ' + matchUpload.radiant_team_name + ', 夜魇=' + matchUpload.dire_team_name + ')';
	var c2_legend = '团战点';
	
    var charts = [{
        bindTo: "#chart-diff",
        columns: difference,
        xs: {
            c1_legend:'time',
            c2_legend:'fightsTime',
        },
        types: {
            c1_legend:"area-spline",
            c2_legend:'scatter',
        },
        color: {
            pattern: color_array
        },
        xLabel: 'Game Time (minutes)',
        yLabel: 'Radiant Advantage'
        }];
    charts.forEach(function(chart) {
        c3.generate({
            bindto: chart.bindTo,
            data: {
                xs: chart.xs,
                columns: chart.columns,
                types: chart.types
            },
            color: chart.color,
            axis: {
                x: {
                    type: 'timeseries',
                    tick: {
                        format: function(x) {
                            return moment().startOf('day').seconds(x).format("H:mm");
                        }
                    },
                    label: chart.xLabel
                },
                y: {
                    label: chart.yLabel
                }
            },
            zoom:{
                enabled: false,
                rescale: false
            },
            tooltip: {
                contents: function(d, defaultTitleFormat, defaultValueFormat, color) {
                    d.sort(function(a, b) {
                        return b.value - a.value
                    });
                    return this.getTooltipContent(d, defaultTitleFormat, defaultValueFormat, color);
                }
            }
        });
    });


};

var getFightsTime = function (x) {
    var times = ["fightsTime"];
    x.forEach(function(e){
        times.push(e.start);
    });
    return times;
};

var getFightsGold = function (x) {
    var golds = ["teamFightsGold"];
    x.forEach(function(e){
        golds.push(e.radiant_gold_delta);
    });
    return golds;
};

var getFightsPoint = function (difference, fights) {
    var timeMap = {};
    for (var i=0;i<difference[0].length;i++){
        timeMap[difference[0][i]] = difference[2][i];
    }
    var fightsTime = ["teamFightsTime"];
    fights.forEach(function(e){
        var start = e.start - e.start % 60;
        var value = timeMap[start + 60] - timeMap[start];
        fightsTime.push(timeMap[start] + parseInt(value * (e.start % 60) / 60))
    });
    return fightsTime;
}

function addTimefightsIcon(startTime) {
    var xmlns = "http://www.w3.org/2000/svg";
    var svg = document.getElementsByTagName("svg")[0]
    var svg_img = document.createElementNS(xmlns, "image");
    svg_img.href.baseVal = "/public/images/ft_icon.png";
    svg_img.setAttributeNS(null, "x", "0");
    svg_img.setAttributeNS(null, "y", "0");
    svg_img.setAttributeNS(null, "height", "120px");
    svg_img.setAttributeNS(null, "width", "20px");
    svg.appendChild(svg_img);
}

