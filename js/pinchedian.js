function mymap(){

	var svg = d3.select("svg")
	var width = svg.attr("width")
	var height = svg.attr("height");
	//中国地图映射
	var projection = d3.geoMercator()
    .center([105, 38])
    .scale(700)
    .translate([width/2, height/2]);
    
    var geoPath = d3.geoPath().projection(projection);
    
    d3.queue()
		.defer(d3.json, "json/china.geojson")
		.defer(d3.csv, "csv/pinche.csv", typepinche)
		// .defer(d3.tsv, "walMart.tsv", typeWalmart)
		.await(ready);
		
	function ready(error, china, pinche){
		if (error) throw error;
		//画地图
		svg.selectAll("path").data(china.features)
		.enter().append("path")
		.attr("d", geoPath).attr("class", "province")
		
		pinche.forEach(function(d){d.x = d.load_position_x;d.y = d.load_position_y});
		
		//以出发地为key nest
		datachufa = d3.nest().key(function(d){return d.order_start_warehouse_name})
		.key(function(d){return d.order_dest_warehouse_name}).entries(pinche);
		
		datachufa.forEach(function(d)
			{
				var dvalues = d.values[0].values;
				dvalues = dvalues.filter(function(e){return e.shipment_segment == "首段"})
				d.x = dvalues[0].start_warehouse_x;d.y = dvalues[0].start_warehouse_y;
			});
//			console.log(datachufa)
		//以目标地为key nest
		var datamubiao = d3.nest().key(function(d){return d.order_dest_warehouse_name}).entries(pinche);
		datamubiao.forEach(function(d)
			{
				var dvalues = d.values;	
				d.values = dvalues.filter(function(e){return e.shipment_segment == "终段"})
				d.x = d.values[0].dest_warehouse__x;d.y = d.values[0].dest_warehouse_y;
			});	
		//以拼车地为key nest()
		var dataquzhong = pinche.filter(function(d){return d.shipment_segment !="终段"})
		var datapin = d3.nest().key(function(d){return d.load_position_name}).entries(dataquzhong);
		datapin.forEach(function(d)
			{
				d.x = d.values[0].load_position_x;d.y = d.values[0].load_position_y;
			});
		
		//画button
		var buttonName = ["出发库分布", "目标库分布","拼车地点分布","清空"];
		d3.select("#controls").selectAll("button.show")
		.data(buttonName).enter()
		.append("button")
		.on("click",buttonClick)
		.html(function(d){return d;})
		
		buttonClick("出发库分布");
		
		//伸缩尺
		var mapZoom = d3.zoom().on("zoom", zoomed);
		function transform() {
			return d3.zoomIdentity
			  .translate(projection.translate()[0] , projection.translate()[1])
			  .scale(projection.scale())
		}
		svg.call(mapZoom.transform, transform).call(mapZoom);
		
		function zoomed(){
			var transform = d3.zoomTransform(svg.node());
			projection.translate([transform.x,transform.y]).scale(transform.k);
			d3.selectAll("path").attr("d",geoPath)
			svg.selectAll("circle")
			.attr("transform",function(d){return "translate(" 
						+ projection([d.x,d.y])[0] + "," 
						+ projection([d.x,d.y])[1] + ")"})
		}
		
		//button按键相应
		function buttonClick(dataName){

			switch(dataName){
				case "出发库分布":
					if(svg.selectAll("circle.chufa").empty()){
						svg.selectAll("circle.chufa").data(datachufa).enter().append("circle")
						.attr("class", "chufa")
						.attr("transform",function(d){return "translate(" 
						+ projection([d.x,d.y])[0] + "," 
						+ projection([d.x,d.y])[1] + ")"})
						.on("click", chufaClick)
						.on("mouseover",hover)
						.on("mouseout",mouseout)

					}
					else{svg.selectAll("circle.chufa").remove();}
					break;
				case "目标库分布":
					if(svg.selectAll("circle.mubiao").empty()){
						svg.selectAll("circle.mubiao").data(datamubiao).enter().append("circle")
						.attr("class","mubiao")
						.attr("transform",function(d){return "translate(" 
						+ projection([d.x,d.y])[0] + "," 
						+ projection([d.x,d.y])[1] + ")"})
					}
					else{svg.selectAll("circle.mubiao").remove();}
					break;
				case "拼车地点分布":
					if(svg.selectAll("circle.pin").empty()){
						svg.selectAll("circle.pin").data(datapin).enter().append("circle")
					.attr("class","pin")
					.attr("transform",function(d){return "translate(" 
						+ projection([d.x,d.y])[0] + "," 
						+ projection([d.x,d.y])[1] + ")"})
					}
					else{svg.selectAll("circle.pin").remove();}
					break;
				case "清空":
					svg.selectAll("circle").remove();
					d3.selectAll("td.chufa,td.mubiao,td.pinche").data(["","",""])
					.html(function(p){return p});
					break;
			}
			
		}
		
		//将信息显示视图加上
		d3.text("show.html",function(data){
			d3.select("body").append("div").attr("id","info").html(data);
		});
		
		//点击出发点
		function chufaClick(clickD){
			var nestArray = clickD || [];
			svg.selectAll("circle").remove();
			var chufaxy = projection([nestArray.x, nestArray.y]);
			//画出发圆
			svg.selectAll("circle").data([nestArray]).enter()
			.append("circle")
			.attr("class", "chufa")
			.attr("transform",function(d){return "translate("+ chufaxy[0] + "," + chufaxy[1] + ")";})
			.style("fill","Blue")
			
			var chufamubiaoArray = nestArray.values;
//			chufamubiaoArray = d3.nest().key(function(d){return d.dest_warehouse_name}).entries(nestArray)
			chufamubiaoArray.alldestName = "";
			chufamubiaoArray.forEach(function(d){
				chufamubiaoArray.alldestName += d.key + "  ,  ";
				});
			chufamudi = chufamubiaoArray;
			chufamudi.forEach(function(d){
				var pinchemudi = d.values;
				pinchemudi = pinchemudi.filter(function(e){return e.shipment_segment == "终段"})
				d.x = pinchemudi[0].dest_warehouse__x;
				d.y = pinchemudi[0].dest_warehouse_y;
			})
			//画目标圆
			svg.selectAll("circle.mubiao.xuan").data(chufamudi).enter()
			.append("circle").attr("class", "mubiao").classed("xuan",true)
			.attr("transform",function(d){
				var destxy = projection([d.x, d.y])
				return "translate("+ destxy[0] + "," + destxy[1] + ")";})
			.on("mouseover", hover)
			.on("mouseout", mouseout)
			.on("click",mubiaoClick)
			//写信息
			d3.selectAll("td.chufa")
			.data([nestArray.key])
			.html(function(p){return p});
			var destNameArray = "";
			d3.selectAll("td.mubiao")
			.data([chufamubiaoArray.alldestName])
			.html(function(p){return p});
			
			
		}
		
		function mubiaoClick(clickD){
			var mubiaoArray = clickD || [];
			svg.selectAll("circle.mubiao").remove();
			svg.selectAll("circle.mubiao").data([mubiaoArray]).enter()
			.append("circle")
			.attr("class", "mubiao")
			.attr("transform",function(d){
				var destxy = projection([d.x, d.y])
				return "translate("+ destxy[0] + "," + destxy[1] + ")";
			})
			.style("fill","Green")
			
			d3.selectAll("td.mubiao")
			.data([mubiaoArray.key])
			.html(function(p){return p});
			var pinchedianArray = mubiaoArray.values;
			console.log(pinchedianArray)
			pinchedianArray = pinchedianArray.filter(function(d){return d.shipment_segment != "终段"});
			svg.selectAll("circle.pin").data(pinchedianArray).enter()
			.append("circle").attr("class","pin")
			.attr("transform",function(d){
				var destxy = projection([d.load_position_x, d.load_position_y])
				return "translate("+ destxy[0] + "," + destxy[1] + ")";})
			.style("fill","Yellow")
			pinchedianArray = d3.nest().key(function(d){return d.load_position_name}).entries(pinchedianArray);

			pinchedianArray.allpinName = "";
			pinchedianArray.forEach(function(d){
				pinchedianArray.allpinName += d.key + "    ";
				});
			d3.selectAll("td.pinche")
			.data([pinchedianArray.allpinName])
			.html(function(p){return p});
		}
		
		function hover(){
			// var nestArray = hoverD || [];
			// nestArray.forEach
			d3.select(this).classed("active",true)
		}
		
		function mouseout(){
			d3.select(this).classed("active",false)
		}
	}
	
	function typepinche(d) {
//		var p = projection(d);
//		d[0] = p[0], d[1] = p[1];
		// d.date = parseDate(d.date);
		// console.log(d);
		return d;
	}
}
