INJECTIONS = {
    "1.53.1": (
        ".fetchTopojson=function(){var t=this,e=y.getTopojsonPath(t.topojsonURL,t.topojsonName);return new Promise("
        'function(r,a){n.json(e,function(n,i){if(n)return 404===n.status?a(new Error(["plotly.js could not find '
        'topojson file at",e,".","Make sure the *topojsonURL* plot config option","is set properly."].join(" "))):'
        'a(new Error(["unexpected error while fetching topojson file at",e].join(" ")));'
        "PlotlyGeoAssets.topojson[t.topojsonName]=i,r()})})}"
    ),
    "1.54.1": (
        ".fetchTopojson=function(){var t=this,e=x.getTopojsonPath(t.topojsonURL,t.topojsonName);return new Promise("
        '(function(r,a){n.json(e,(function(n,i){if(n)return 404===n.status?a(new Error(["plotly.js could not find '
        'topojson file at",e,".","Make sure the *topojsonURL* plot config option","is set properly."].join(" "))):'
        'a(new Error(["unexpected error while fetching topojson file at",e].join(" ")));'
        "PlotlyGeoAssets.topojson[t.topojsonName]=i,r()}))}))}"
    ),
}
