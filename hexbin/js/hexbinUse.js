function mymap(){
	var svg = d3.select("svg")
	var width = svg.attr("width")
	var height = svg.attr("height");
	var rangeRadius = 8;
	var hexbin = d3.hexbin().extent([[0,0],[width, height]]).radius(rangeRadius);
	var hexagonRadius = 10;
	var radius = d3.scaleSqrt().domain([0, 12]).range([0, hexagonRadius]);
	var projection = d3.geoMercator()
    .center([105, 38])
    .scale(700)
    .translate([width/2, height/2]);
	var geoPath = d3.geoPath().projection(projection);
	var pcolor = d3.scalePow().exponent(0.3).domain([1, 34])
	.range(["darkgray", "gray"])
	.interpolate(d3.interpolateLab);
	
	d3.queue()
		.defer(d3.json, "json/china.geojson")
		.defer(d3.csv, "csv/znp.csv", typepinche)
		// .defer(d3.tsv, "walMart.tsv", typeWalmart)
		.await(ready);
	function ready(error, china, pinche){
		if (error) throw error;
		svg.selectAll("path").data(china.features)
		.enter().append("path")
		.attr("d", geoPath).attr("class", "province")
		.style("fill", function(d){return pcolor(d.properties.id)})
		console.log(china);
		var hexEntity = hexbin(pinche)
		hexEntity.forEach(function(d){
			d.sumValue = d3.sum(d, function(e){return +e.city_count})
			})
		var maxValue = d3.max(hexEntity,function(d){return d.sumValue});
		
		var color = d3.scalePow().exponent(0.3).domain([1, maxValue])
		.range(["lightgreen", "red"])
		.interpolate(d3.interpolateLab);
		// var color = d3.scaleLog().base(0).domain([1, maxValue]).range(["lightgreen", "red"]).interpolate(d3.interpolateLab);
		
		svg.append("g")
		.attr("class", "hexagon")
		.selectAll("path")
		.data(hexEntity.sort(function(a, b) { return b.length - a.length; }))
		.enter().append("path")
		.attr("d", function(d) { return hexbin.hexagon(radius(d.length)); })
		.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
		.attr("fill", function(d) { return color(d.sumValue); })
		svg.selectAll("g.hexagon").selectAll("path")
		.on("mouseover", hover)
		.on("mouseout", mouseout)
		.on("click", click);
		
		function hover(){
			// var nestArray = hoverD || [];
			// nestArray.forEach
			d3.select(this).classed("active",true)

		}
		
		function mouseout(){
			d3.select(this).classed("active",false)
		}
		
		function click(clickD){
			var nestArray = clickD || [];
			infoText = getInfo(nestArray);
			var realXY = projection.invert([nestArray.x, nestArray.y])
			// console.log()
			d3.selectAll("td.data")
			.data([infoText, realXY[0].toFixed(2) + " , " + realXY[1].toFixed(2)])
			.html(function(p){return p});
			// d3.selectAll("path").classed("highlight",false)
			// d3.select(this).classed("highlight",true)
			svg.selectAll("circle").classed("active",false)
			svg.append("circle").attr("class","circleRegion")
			.attr("transform","translate("+ nestArray.x + "," + nestArray.y + ")")
			.attr("r",rangeRadius).classed("active","true");
		}
		
		d3.text("pincheInfo.html",function(data){
			d3.select("body").append("div").attr("id","info").html(data);
		});
		
		function getInfo(d)
		{
			var info = "";
			d.forEach(function(e){info = info + e.city_name + "(" + e.city_count + ")" + "  "})
			return info;
		}
		
	};
	function typepinche(d) {
		var p = projection(d);
		d[0] = p[0], d[1] = p[1];
		// d.date = parseDate(d.date);
		// console.log(d);
		return d;
	}
	
}
