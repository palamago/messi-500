
var MessiViz;
;(function(global, document, $, d3, c3){

	"use strict";

    MessiViz = global.MessiViz = global.MessiViz || {};

    MessiViz.MATCHES;

    MessiViz.GOALS;

    MessiViz.SELECTED = null;

    MessiViz.$loader = $('#loader-container');

    MessiViz.competitions = ["PRM", "CUP", "EUR", "FRN", "WCQ", "WCP", "SUP", "IUP", "CPA", "WCT"];

	MessiViz.color = d3.scale.ordinal()
			    .domain(MessiViz.competitions)
			    .range(d3.scale.category10().range());

    MessiViz.svg;

    MessiViz.groups = {};
    MessiViz.totals = {
    	$goals: 	$('#totals-goals'),
    	$assists: $('#totals-assists'),
    	$minutes: $('#totals-minutes'),
    	$matches: $('#totals-matches'),
    	$goalsLeft: $('#totals-goals-left'),
    	$goalsRight: $('#totals-goals-right'),
    	$goalsHead: $('#totals-goals-head'),
    	$goalsHand: $('#totals-goals-hand'),
    	$goalsChest: $('#totals-goals-chest')
    };

    MessiViz.barGap = {
    	x:0,
    	y:0
    };

    MessiViz.init = function(){

    	d3.csv('data/messi-500-matches.csv',
    		function(data) {
    			MessiViz.MATCHES = data;
    			d3.csv('data/messi-500-goals.csv',
		    		function(data) {
				  		MessiViz.GOALS = data;
						MessiViz.dataLoaded();
					}
				);
    		});

    };

    MessiViz.dataLoaded = function() {

    	var goals_nested = d3.nest()
		  .key(function(d) { return d.date; })
		  .map(MessiViz.GOALS);

    	_.forEach(MessiViz.MATCHES,function(match){
    		if(goals_nested[match.date]){
    			match.details = goals_nested[match.date];
    		} else {
    			match.details = [];
    		}
    	});

    	MessiViz.renderD3Chart(MessiViz.MATCHES);

    	//MessiViz.renderD3Filters();

    	MessiViz.initEvents();

    	MessiViz.hideTooltip();

    };

    MessiViz.renderD3Chart = function(DATA){

    	//MessiViz.MATCHES = MessiViz.MATCHES.slice(0,100);
    	MessiViz.SELECTED_MATCHES = DATA;

    	//SVG
    	if(!MessiViz.svg){

	    	MessiViz.margin = {top: 0, right: 0, bottom: 0, left: 0},
			MessiViz.width = $(window).width() - MessiViz.margin.left - MessiViz.margin.right,
			MessiViz.height = $(window).height() - MessiViz.margin.top - MessiViz.margin.bottom;
			MessiViz.chartSize = 100;

			$('.carousel-inner').height(MessiViz.height-$('.masthead').height()-MessiViz.chartSize);

			MessiViz.svg = d3.select("#svg-container").append("svg")
			    .attr("width", MessiViz.width + MessiViz.margin.left + MessiViz.margin.right)
			    .attr("height", MessiViz.height + MessiViz.margin.top + MessiViz.margin.bottom)
			  	.append("g")
			    .attr("transform", "translate(" + MessiViz.margin.left + "," + MessiViz.margin.top + ")");

	        MessiViz.tooltip = d3.select('body')
	        				.append("div")
							.classed('info-tooltip',true)
	                   		.style("top", 0)
	                        .style("left", 0)
	                        .style("width", MessiViz.chartSize*1.5+'px')
	                        .style("height", MessiViz.chartSize*1.5+'px')
	                        .style("display", "block");

			
			MessiViz.tooltipx = d3.scale.linear()
				.domain([0, DATA.length])
			    .range([MessiViz.chartSize,MessiViz.width-MessiViz.chartSize*2.5]);

			MessiViz.tooltipy = d3.scale.linear()
				.domain([0, DATA.length])
			    .range([0,MessiViz.height - MessiViz.chartSize*2.5]);

			MessiViz.$loader.fadeOut(2000);
    	}

    	MessiViz.renderGoals(DATA);
    	MessiViz.renderAssists(DATA);
    	MessiViz.renderMinutes(DATA);
    	MessiViz.updateTotals(DATA);

    	if(!MessiViz.lineh){

    		//selection lines
			MessiViz.lineh = MessiViz.svg.append("line")
							.classed('lineh',true)
	                   		.attr("x1", 0)
	                        .attr("y1", 0)
	                        .attr("x2", MessiViz.width)
	                        .attr("y2", 0);

			MessiViz.linev = MessiViz.svg.append("line")
							.classed('linev',true)
	                   		.attr("x1", 0)
	                        .attr("y1", 0)
	                        .attr("x2", 0)
	                        .attr("y2", MessiViz.height);
    	}

    };

    MessiViz.renderGoals = function (DATA){

    	if(!MessiViz.groups.goals){
    		MessiViz.groups.goals = MessiViz.svg.append("g").classed('goals',true);
    		MessiViz.maxGoals = d3.max(DATA, function(d) { return d.goals; });
    		
    		MessiViz.totals.goals = MessiViz.groups.goals
    			.append('text')
	    		.text(function(d){return '';})
				.classed("totals-number",true)
				.attr("id","totals-number-goals")
				.attr('y',function(d,i){return MessiViz.height/2;})
				.attr('x',function(d,i){return (MessiViz.width-(MessiViz.chartSize*2))/4;})
				.attr('text-anchor','middle');

    		MessiViz.groups.goals
    			.append('text')
	    		.text(function(d){return 'GOLES';})
				.classed("totals-label",true)
				.attr('y',function(d,i){return 0;})
				.attr('x',function(d,i){return MessiViz.height/2 - MessiViz.chartSize/2;})
				.attr('text-anchor','middle')
				.attr('transform','rotate(90)');

    	}

		var y = d3.scale.ordinal()
			.domain([0, DATA.length])
		    .rangeBands([0, MessiViz.height-MessiViz.chartSize]);

		var x = d3.scale.linear()
			.domain(d3.range(0, 6, 1))
		    .range([0,MessiViz.chartSize]);

		y.domain(DATA.map(function(d,i) { return i; }));
		x.domain([0, MessiViz.maxGoals]);

		MessiViz.barGap.y = y.rangeBand();

		var bars = MessiViz.groups.goals.selectAll(".bar.bar-goal")
	    	.data(DATA)

	   	bars.exit().remove();

	   	bars.enter()
	    	.append("rect")
			.attr("x", function(d,i) { return 0; })
			.attr("width", function(d) { return 0; });
			
		bars.attr("class", function(d,i){
				return 'match'+d.id + ' ' +d.competition;
			})
			.classed("bar",true)
			.classed("bar-goal",true)
			.transition()
			.delay(function (d, i) { return i*5+2000; })
			.attr("fill", function(d,i) { return MessiViz.color(d.competition); })
			.attr("y", function(d,i) { return y(i); })
			.attr("height", y.rangeBand())
			.attr("width", function(d) { return (x(d.goals)==0)?2:x(d.goals); });	

		var bars = MessiViz.groups.goals.selectAll(".bar.bar-goal-fill")
	    	.data(DATA)

	   	bars.exit().remove();

	   	bars.enter()
	    	.append("rect")
			.classed("bar",true)
			.classed("bar-goal-fill",true)
			.attr("fill", "transparent")
			.attr("x", function(d,i) { return 0; })
			.attr("width", function(d) { return x(MessiViz.maxGoals); })

			
		bars.attr("y", function(d,i) { return y(i); })
			.attr("height", y.rangeBand())
			.on('mouseover',function(d){
				MessiViz.hover(d);
			})
			.on('mouseout',function(d){
				MessiViz.unhover(d);
			});

    };

    MessiViz.renderAssists = function (DATA){

    	if(!MessiViz.groups.assists){
    		MessiViz.groups.assists = MessiViz.svg.append("g").classed('assists',true);
			MessiViz.maxAssists = d3.max(DATA, function(d) { return d.assists; });
    		
    		MessiViz.totals.assists = MessiViz.groups.assists
    			.append('text')
	    		.text(function(d){return '';})
				.classed("totals-number",true)
				.attr("id","totals-number-assists")
				.attr('y',function(d,i){return MessiViz.height/2;})
				.attr('x',function(d,i){return MessiViz.width-(MessiViz.chartSize) - (MessiViz.width-(MessiViz.chartSize*2))/4;})
				.attr('text-anchor','middle');

    		MessiViz.groups.assists
    			.append('text')
	    		.text(function(d){return 'ASISTENCIAS';})
				.classed("totals-label-assists",true)
				.attr('y',function(d,i){return MessiViz.width;})
				.attr('x',function(d,i){return -MessiViz.height/2 + MessiViz.chartSize/2;})
				.attr('text-anchor','middle')
				.attr('transform','rotate(270)');

    	}

		var y = d3.scale.ordinal()
			.domain([0, DATA.length])
		    .rangeBands([0, MessiViz.height-MessiViz.chartSize]);

		var x = d3.scale.linear()
			.domain(d3.range(0, MessiViz.maxAssists, 1))
		    .range([0,MessiViz.chartSize]);


		y.domain(DATA.map(function(d,i) { return i; }));
		x.domain([0, MessiViz.maxAssists]);

		var bars = MessiViz.groups.assists.selectAll(".bar.bar-assist")
	    	.data(DATA)

	   	bars.exit().remove();

	   	bars.enter()
			.append("rect")
			.attr("x", function(d,i) { return MessiViz.width; })
			.attr("width", function(d) { return 0; });
		
		bars.attr("class", function(d,i){
				return 'match'+d.id + ' ' +d.competition;
			})
			.classed("bar",true)
			.classed("bar-assist",true).transition()
			.delay(function (d, i) { return i*5+2000; })
			.attr("fill", function(d,i) { return MessiViz.color(d.competition); })
			.attr("y", function(d,i) { return y(i); })
			.attr("height", y.rangeBand())
			.attr("width", function(d) { return (x(d.assists)==0)?2:x(d.assists); })
			.attr("x", function(d,i) { var xval = (x(d.assists)==0)?2:x(d.assists);  return MessiViz.width - xval; });	

		var bars = MessiViz.groups.assists.selectAll(".bar.bar-assist-fill")
	    	.data(DATA)

	   	bars.exit().remove();

	   	bars.enter()
	    	.append("rect")
			.classed("bar",true)
			.classed("bar-assist-fill",true)
			.attr("fill", "transparent")
			.attr("x", function(d,i) { return MessiViz.width - x(MessiViz.maxAssists); })
			.attr("width", function(d) { return x(MessiViz.maxAssists); });	
			
		bars.attr("y", function(d,i) { return y(i); })
			.attr("height", y.rangeBand())
			.on('mouseover',function(d){
				MessiViz.hover(d);
			})
			.on('mouseout',function(d){
				MessiViz.unhover(d);
			});

    };

    MessiViz.renderMinutes = function (DATA){

    	if(!MessiViz.groups.minutes){
    		MessiViz.groups.minutes = MessiViz.svg.append("g").classed('minutes',true);
			MessiViz.maxMinutes = d3.max(DATA, function(d) { return parseInt(d.minutes); });
    	
    		MessiViz.totals.minutes = MessiViz.groups.minutes
    			.append('text')
	    		.text(function(d){return '';})
				.classed("totals-number",true)
				.attr("id","totals-number-minutes")
				.attr('y',function(d,i){return MessiViz.height/2;})
				.attr('x',function(d,i){return MessiViz.width/2;})
				.attr('text-anchor','middle');

    		MessiViz.totals.matches = MessiViz.groups.minutes
    			.append('text')
	    		.text(function(d){return '';})
				.classed("totals-number",true)
				.attr("id","totals-number-matches")
				.attr('y',function(d,i){return MessiViz.height/2+200;})
				.attr('x',function(d,i){return MessiViz.width/2;})
				.attr('text-anchor','middle');

    	    MessiViz.groups.minutes
    			.append('text')
	    		.text(function(d){return 'MINUTOS';})
				.classed("totals-label",true)
				.attr('y',function(d,i){return MessiViz.height;})
				.attr('x',function(d,i){return MessiViz.width/2;})
				.attr('text-anchor','middle');

    	}

		var x = d3.scale.ordinal()
			.domain([0, DATA.length])
		    .rangeBands([MessiViz.chartSize, MessiViz.width-MessiViz.chartSize]);

		var y = d3.scale.linear()
			.domain(d3.range(0, MessiViz.maxMinutes, 1))
		    .range([0,MessiViz.chartSize]);

		  x.domain(DATA.map(function(d,i) { return i; }));
		  y.domain([0, MessiViz.maxMinutes]);

		MessiViz.barGap.x = x.rangeBand();

		var bars = MessiViz.groups.minutes.selectAll(".bar.bar-minute")
	    	.data(DATA)

	   	bars.exit().remove();

	   	bars.enter()
			.append("rect")
			.attr("y", function(d,i) { return MessiViz.height })
			.attr("height",function(d) { return  0 });
			
		bars.attr("class", function(d,i){
				return 'match'+d.id + ' ' +d.competition;
			})
			.classed("bar",true)
			.classed("bar-minute",true)
			.transition()
			.delay(function (d, i) { return i*5+2000; })
			.attr("fill", function(d,i) { return MessiViz.color(d.competition); })
			.attr("x", function(d,i) { return x(i); })
			.attr("width", x.rangeBand())
	        .attr("y", function (d, i) { return MessiViz.height-y(d.minutes); })
	        .attr("height", function (d) { return y(d.minutes); });
		

		var bars = MessiViz.groups.minutes.selectAll(".bar.bar-minute-fill")
	    	.data(DATA)

	   	bars.exit().remove();

	   	bars.enter()
	    	.append("rect")
			.classed("bar",true)
			.classed("bar-minute-fill",true)
			.attr("fill", "transparent")
			.attr("y", function(d,i) { return MessiViz.height - y(MessiViz.maxMinutes); })
			.attr("height", function(d) { return  y(MessiViz.maxMinutes) });	
			
		bars.attr("width", x.rangeBand())
			.attr("x", function(d,i) { return x(i); })
			.on('mouseover',function(d){
				MessiViz.hover(d);
			})
			.on('mouseout',function(d){
				MessiViz.unhover(d);
			});

    };

    MessiViz.renderD3Filters = function(){
    	var g = MessiViz.svg.append("g").classed('competitions-group',true);
    	
    	g.selectAll("text.competition")
	    	.data(MessiViz.competitions)
	    	.enter()
	    	.append("text")
	    	.text(function(d){return d;})
			.classed("competition",true)
			.attr('y',function(d,i){return 100;})
			.attr('x',function(d,i){return 300;})
			.attr('text-anchor','middle')
			.on('click',function(d){
				MessiViz.hideTooltip();
				MessiViz.filter('competition',d);
			})

			/*.on('mouseover',function(competition){
				MessiViz.linev.transition().attr('x1',0).attr('x2',0);
		    	MessiViz.lineh.transition().attr('y1',0).attr('y2',0);
				MessiViz.tooltip
    			.html("")
	    		.transition()
    			.style('opacity','');

    			var source = d3.select(this);

    			var diagonal = d3.svg.diagonal()
				    .source(function(d) { 
				    	return {"x":d.source.x, "y":d.source.y}; 
				    })            
				    .target(function(d) { 
				    	return {"x":d.target.x, "y":d.target.y}; 
				    })
				    .projection(function(d) {
					  return [d.x, d.y];
					});

    			var competitionMatches = [];
    				MessiViz.svg
    				.selectAll(".bar."+competition)
    				.each(function(d){
    					var bar = d3.select(this);
    					if(bar.classed('bar-minute')){
    						competitionMatches.push({
    							source:{x:parseInt(source.attr('x')),y:parseInt(source.attr('y'))},
    							target:{x:parseInt(bar.attr('x')),y:parseInt(bar.attr('y'))}
    						});
    					}else
    					if(bar.classed('bar-goal')){
    						competitionMatches.push({
    							source:{x:parseInt(source.attr('x')),y:parseInt(source.attr('y'))},
    							target:{x:parseInt(bar.attr('width')),y:parseInt(bar.attr('y'))}
    						});
    					}else
    					if(bar.classed('bar-assist')){
    						competitionMatches.push({
    							source:{x:parseInt(source.attr('x')),y:parseInt(source.attr('y'))},
    							target:{x:parseInt(bar.attr('x')),y:parseInt(bar.attr('y'))}
    						});
    					}
    				})
    				.transition()
    				.attr('fill','red');

				var pathToMatches = 
					MessiViz.svg.selectAll("path.path-"+competition)
		            .data(competitionMatches);
		        
		        pathToMatches.enter()
		            .append("path")
		            .attr("class", "path-"+competition)
		            .attr("d", diagonal);
		            
		        pathToMatches
		        	.transition()
		            .attr('opacity',1);

			})
			.on('mouseout',function(competition){

    			MessiViz.svg
    				.selectAll(".bar."+competition)
    				.transition()
    				.attr('fill',function(d){
    					return MessiViz.color(d.competition);
    				});

    			MessiViz.svg.selectAll("path.path-"+competition)
		            .transition(2000)
		            .attr('opacity',0);
			})*/
			.transition()
			.delay(function (d, i) { return i*10; })
	        .attr("y", function (d, i) { return 100+i*20; });

    };

    MessiViz.hover = function(data){

    	MessiViz.SELECTED = data.id;
    	d3.selectAll('rect.match'+data.id).classed('selectedMatch', true);
    	d3.selectAll('circle.match'+data.id).classed('selectedGoal', true);
    	var x = d3.select('rect.bar-minute.match'+data.id).attr('x');
    	MessiViz.linev.transition().style('opacity',1).attr('x1',Math.round(x)+Math.round(MessiViz.barGap.x/2)).attr('x2',Math.round(x)+Math.round(MessiViz.barGap.x/2));
    	var y = d3.select('rect.bar-goal.match'+data.id).attr('y');
    	MessiViz.lineh.transition().style('opacity',1).attr('y1',Math.round(y)+Math.round(MessiViz.barGap.y/2)).attr('y2',Math.round(y)+Math.round(MessiViz.barGap.y/2));
    	MessiViz.tooltip
    		.html(function(){
    			return '<p>'+data.home+' <strong>'+data.home_goals+'</strong></p>' + 
    				'<p>'+data.away+' <strong>'+data.away_goals+'</strong></p>' +
    				'<p>'+data.date+'</p>' +
    				'<p style="color:'+MessiViz.color(data.competition)+'"><strong>'+data.competition+'</strong></p>' +
    				'<p> Goals:'+data.goals+'</p>' +
    				'<p> Assists:'+data.assists+'</p>' +
    				'<p> Minutes:'+data.minutes+'</p>'
    				;
    		})
    		.transition()
    		.style('opacity','1')
    		.style('left',MessiViz.tooltipx(data.id)+'px')
    		.style('top',MessiViz.tooltipy(data.id)+'px');
    };

    MessiViz.unhover = function(data,match){
    	d3.selectAll('rect.bar').classed('selectedMatch',false);
    	d3.selectAll('circle.goal').classed('selectedGoal',false);
    };

    MessiViz.hideTooltip = function(data,match){
    	MessiViz.tooltip.transition()
    			.style('opacity','0');
    	MessiViz.linev.transition()
    			.attr('x1',0)
    			.attr('x2',MessiViz.width)
    			.style('opacity',0);
    	MessiViz.lineh.transition()
    			.attr('y1',MessiViz.height)
    			.attr('y2',0)
    			.style('opacity',0);
    };

    MessiViz.initEvents = function(){
    	$(document).keydown(function(e) {
		    switch(e.which) {
		        case 37: // left
		        case 38: // up
		        	MessiViz.prev();
		        break;

		        case 39: // right
		        case 40: // down
			        MessiViz.next();
		        break;

		        case 27: // esc
			        MessiViz.hideTooltip();
		        break;

		        default: return; // exit this handler for other keys
		    }
		    e.preventDefault(); // prevent the default action (scroll / move caret)
		});

		$('.btn-filter').on('click',function(){
			var $filter = $(this);
			$filter.siblings().removeClass('active').removeAttr('disabled');
			$filter.attr("disabled","disabled").addClass('active');
			MessiViz.hideTooltip();
			MessiViz.filter($filter.data('field'),$filter.data('filter'));
		});

		$('#clear-filter').on('click',function(){
			$('.btn-filter').removeClass('active').removeAttr('disabled');
			MessiViz.clear();
		});

		$('#filtersModal').on('show.bs.modal', function (event) {
			MessiViz.hideTooltip();
		});

		$('#carousel-messi').carousel({
		  interval: false
		})
		.off('keydown.bs.carousel');

		$('.container').mouseenter(function(){
			MessiViz.hideTooltip();
		});

		$('#carousel-messi').on('slid.bs.carousel', function (event) {
		  	var id = $(event.relatedTarget).attr('id');
		  	if(id=='item-home'){
		  		MessiViz.hideForceLayout()
		  	} else {
		  		MessiViz.renderForceLayout();
		  	}

		});

    };

    MessiViz.renderForceLayout = function(){


		var nodes = MessiViz.GOALS_SELECTED.map(function(d) { d.radius = 8; return d;});

		nodes.unshift({radius:0,fixed:true});
		
		var force = d3.layout.force()
		    .gravity(0.08)
		    .charge(function(d, i) { return d.fixed ? 0 : -10; })
		    .nodes(nodes)
		    .size([MessiViz.width, MessiViz.height]);

    	if(!MessiViz.groups.forceLayout){
    		MessiViz.groups.forceLayout = MessiViz.svg.append("g").classed('force-layout',true);
    	}
		force.start();

		var circles = MessiViz.groups.forceLayout.selectAll("circle.goal")
    		.data(nodes.slice(1));
		
		circles.exit().remove();

		circles.enter()
		  	.append("svg:circle")
		    .attr("r", function(d){ return d.radius })
			.attr("cx", 0)
			.attr("cy", 0);
		    
		circles
			//.style("fill", function(d, i) { return MessiViz.color(d.competition); })
			.attr("class",function(d){return "match"+d.match_id;})
		  	.classed("goal",true)

		force.on("tick", function(e) {
		  nodes[0].x = MessiViz.width / 2;
    	  nodes[0].y = MessiViz.height / 2;	
		  var q = d3.geom.quadtree(nodes),
		      i = 0,
		      n = nodes.length;

		  while (++i < n) {
		    q.visit(collide(nodes[i]));
		  }

		  MessiViz.groups.forceLayout.selectAll("circle.goal")
		      .attr("cx", function(d) { return d.x; })
		      .attr("cy", function(d) { return d.y; });
		});

		force.resume();

		function collide(node) {
		  var r = node.radius + 20,
		      nx1 = node.x - r,
		      nx2 = node.x + r,
		      ny1 = node.y - r,
		      ny2 = node.y + r;
		  return function(quad, x1, y1, x2, y2) {
		    if (quad.point && (quad.point !== node)) {
		      var x = node.x - quad.point.x,
		          y = node.y - quad.point.y,
		          l = Math.sqrt(x * x + y * y),
		          r = node.radius + quad.point.radius;
		      if (l < r) {
		        l = (l - r) / l * .5;
		        node.x -= x *= l;
		        node.y -= y *= l;
		        quad.point.x += x;
		        quad.point.y += y;
		      }
		    }
		    return x1 > nx2
		        || x2 < nx1
		        || y1 > ny2
		        || y2 < ny1;
		  };
		}

    };

    MessiViz.hideForceLayout = function(){
    	MessiViz.groups.forceLayout.selectAll("circle.goal")
    		.transition().attr('r',0).remove();
    };

	MessiViz.updateTotals = function(DATA){

		var goals=0,
			assists=0,
			minutes=0,
			matches=DATA.length;

		MessiViz.GOALS_SELECTED = [];

		DATA.forEach(function(data){
			goals+=parseInt(data.goals);
			assists+=parseInt(data.assists);
			minutes+=parseInt(data.minutes);
			if(data.details.length){
				MessiViz.GOALS_SELECTED = _.concat(MessiViz.GOALS_SELECTED,data.details.map(function(d){d.match_id=data.id;return d;}));
			}
		});

		MessiViz.updateGoals();

		MessiViz.totals.$goals.countTo({
			from: parseInt(MessiViz.totals.$goals.html()), 
			to: goals,
			speed: 1000
		});

		MessiViz.totals.$assists.countTo({
			from: parseInt(MessiViz.totals.$assists.html()), 
			to: assists,
			speed: 1000
		});

		MessiViz.totals.$minutes.countTo({
			from: parseInt(MessiViz.totals.$minutes.html()), 
			to: minutes,
			speed: 1000
		});

		MessiViz.totals.$matches.countTo({
			from: parseInt(MessiViz.totals.$matches.html()), 
			to: matches,
			speed: 1000
		});

	};

	MessiViz.updateGoals = function(){
		var goalsHow = d3.nest()
			.key(function(d) { return d.how; })
			.map(MessiViz.GOALS_SELECTED);

		var goalsMinutes = d3.nest()
			.key(function(d) { 
				var m = parseInt(d.minute);
				return m;
			})
			.map(MessiViz.GOALS_SELECTED);

		MessiViz.totals.$goalsLeft.countTo({
			from: parseInt(MessiViz.totals.$goalsLeft.html()), 
			to: (goalsHow["Left foot"])?goalsHow["Left foot"].length:0,
			speed: 1000
		});

		MessiViz.totals.$goalsRight.countTo({
			from: parseInt(MessiViz.totals.$goalsRight.html()), 
			to: (goalsHow["Right foot"])?goalsHow["Right foot"].length:0,
			speed: 1000
		});

		MessiViz.totals.$goalsHead.countTo({
			from: parseInt(MessiViz.totals.$goalsHead.html()), 
			to: (goalsHow["Head"])?goalsHow["Head"].length:0,
			speed: 1000
		});

		MessiViz.totals.$goalsChest.countTo({
			from: parseInt(MessiViz.totals.$goalsChest.html()), 
			to: (goalsHow["Chest"])?goalsHow["Chest"].length:0,
			speed: 1000
		});

		MessiViz.totals.$goalsHand.countTo({
			from: parseInt(MessiViz.totals.$goalsHand.html()), 
			to: (goalsHow["Hand"])?goalsHow["Hand"].length:0,
			speed: 1000
		});

		if(MessiViz.groups.forceLayout){
			MessiViz.renderForceLayout();
		}

	};

	MessiViz.next = function(){
		MessiViz.unhover(null,MessiViz.SELECTED);
		if(MessiViz.SELECTED<MessiViz.MATCHES.length-1){
			MessiViz.SELECTED++;
		} else {
			MessiViz.SELECTED = 0;
		}
		MessiViz.hover(d3.select('rect.match'+MessiViz.SELECTED).datum(),MessiViz.SELECTED);
	};

	MessiViz.prev = function(){
		MessiViz.unhover(null,MessiViz.SELECTED);

		if(MessiViz.SELECTED>0){
			MessiViz.SELECTED--;
		} else {
			MessiViz.SELECTED = MessiViz.MATCHES.length-1;
		}
		MessiViz.hover(d3.select('rect.match'+MessiViz.SELECTED).datum(),MessiViz.SELECTED);
	};

	MessiViz.filter = function(field,value){
		var DATA = MessiViz.MATCHES.filter(function(d){
			return d[field] == value;
		});
		MessiViz.renderD3Chart(DATA);
	};

	MessiViz.clear = function(){
		MessiViz.renderD3Chart(MessiViz.MATCHES);
	};

    MessiViz.renderMainChart = function(){

		var chartGoals = c3.generate({
			bindto: '#chart',
	        data: {
	            json: MessiViz.MATCHES,
	            keys: {
	                value: ['goals', 'assists','minutes'],
	            },
	            type: 'bar',
	            types: {
		            minutes: 'line'
		        },
	            axes: {
		            sample1: 'y',
		            minutes: 'y2'
		        }
	        },
	        bar: {
		        width: {
		            ratio: 1 // this makes bar width 50% of length between ticks
		        }
		        // or
		        //width: 100 // this makes bar width 100px
		    },
	        axis: {
	        	rotated: true,
	            x: {
	            	show:false
	            },
	            y: {
	            	show:false
	            },
	            y2: {
	            	show:false
	            }

	        },
			legend: {
		        show: true
		    }
	    });

		

    }

})(window, document,jQuery, d3, c3);