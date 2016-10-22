window.generateChartsOn = function generateChartsOn(data, fights) {
    var color_array = [];
    for (var key in constants.player_colors) {
        color_array.push(constants.player_colors[key]);
    }

    var fightsStart = getFightsTime(fights);
    var fightsGold = getFightsGold(fights);
    var difference = [data.difference[0], data.difference[2], fightsStart, fightsGold];

    var charts = [{
        bindTo: "#chart-diff",
        columns: difference,
        xs: {
            'Gold':'time',
            'teamFightsGold':'fightsTime',
        },
        types: {
            'Gold':"area-spline",
            'teamFightsGold':'bar',
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
            bar: { width: { ratio: 0.5 }},
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
    })
    return times;
}

var getFightsGold = function (x) {
    var golds = ["teamFightsGold"];
    x.forEach(function(e){
        golds.push(e.radiant_gold_delta);
    })
    return golds;
}