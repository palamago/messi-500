var MessiViz;

;(function(global, document, $, d3, c3){

	"use strict";

    MessiViz = global.MessiViz = global.MessiViz || {};

    MessiViz.MATCHES;

    MessiViz.GOALS;

    MessiViz.SELECTED = null;

    MessiViz.$loader = $('#loader-container');

    MessiViz.competitions = ["PRM", "CUP", "EUR", "FRN", "WCQ", "WCP", "SUP", "IUP", "CPA", "WCT"];

    MessiViz.svg;

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

    	console.log(MessiViz.MATCHES);

    	//MessiViz.renderMainChart();
    	MessiViz.renderD3Chart();

    	MessiViz.renderD3Totals();

    	MessiViz.initEvents();

    	MessiViz.$loader.fadeOut();

    };

    MessiViz.renderD3Chart = function(){

    	//MessiViz.MATCHES = MessiViz.MATCHES.slice(0,100);

    	//SVG
    	var margin = {top: 0, right: 0, bottom: 0, left: 0},
		    width = $(window).width() - margin.left - margin.right,
		    height = $(window).height() - margin.top - margin.bottom;

		MessiViz.svg = d3.select("body").append("svg")
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
		  	.append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		var chartSize = 100;

		//selection lines
		MessiViz.lineh = MessiViz.svg.append("line")
						.classed('lineh',true)
                   		.attr("x1", 0)
                        .attr("y1", 0)
                        .attr("x2", width)
                        .attr("y2", 0);

		MessiViz.linev = MessiViz.svg.append("line")
						.classed('linev',true)
                   		.attr("x1", 0)
                        .attr("y1", 0)
                        .attr("x2", 0)
                        .attr("y2", height);

        MessiViz.tooltip = d3.select('body')
        				.append("div")
						.classed('info-tooltip',true)
                   		.style("top", 0)
                        .style("left", 0)
                        .style("width", chartSize*1.5+'px')
                        .style("height", chartSize*1.5+'px')
                        .style("display", "block");

		MessiViz.tooltipx = d3.scale.linear()
			.domain([0, MessiViz.MATCHES.length])
		    .range([chartSize,width-chartSize*2.5]);

		MessiViz.tooltipy = d3.scale.linear()
			.domain([0, MessiViz.MATCHES.length])
		    .range([0,height - chartSize*2.5]);

		// Goals
		var g = MessiViz.svg.append("g").classed('goals',true);
		var maxGoals = d3.max(MessiViz.MATCHES, function(d) { return d.goals; });
		
		/*var color = d3.scale.threshold()
		    .domain(d3.range(0, maxGoals, 1))
		    .range(["#FFAAAA", "#D46A6A", "#AA3939", "#801515", "#550000"]);*/

		MessiViz.color = d3.scale.ordinal()
		    .domain(MessiViz.competitions)
		    .range(d3.scale.category10().range());

		var y = d3.scale.ordinal()
			.domain([0, MessiViz.MATCHES.length])
		    .rangeBands([0, height-chartSize]);

		var x = d3.scale.linear()
			.domain(d3.range(0, 6, 1))
		    .range([0,chartSize]);

		  y.domain(MessiViz.MATCHES.map(function(d,i) { return i; }));
		  x.domain([0, maxGoals]);

		  g.selectAll(".bar.bar-goal")
	    	.data(MessiViz.MATCHES)
	    	.enter().append("rect")
			.attr("class", function(d,i){
				return 'match'+i + ' ' +d.competition;
			})
			.classed("bar",true)
			.classed("bar-goal",true)
			.attr("x", function(d,i) { return 0; })
			.attr("width", function(d) { return 0; })
			.attr("y", function(d,i) { return y(i); })
			.attr("height", y.rangeBand())
			.attr("fill", function(d,i) { return MessiViz.color(d.competition); })
			.transition()
			.delay(function (d, i) { return i*10; })
			.attr("width", function(d) { return x(d.goals); });	

		  g.selectAll(".bar.bar-goal-fill")
	    	.data(MessiViz.MATCHES)
	    	.enter().append("rect")
			.classed("bar",true)
			.classed("bar-goal-fill",true)
			.attr("x", function(d,i) { return 0; })
			.attr("width", function(d) { return x(maxGoals); })
			.attr("y", function(d,i) { return y(i); })
			.attr("height", y.rangeBand())
			.attr("fill", "transparent")
			.on('mouseover',function(d,i){
				MessiViz.hover(d,i);
			})
			.on('mouseout',function(d,i){
				MessiViz.unhover(d,i);
			});	

		// Assists
		var g = MessiViz.svg.append("g").classed('assists',true);
		var maxAssists = d3.max(MessiViz.MATCHES, function(d) { return d.assists; });

		/*var color = d3.scale.threshold()
		    .domain(d3.range(0, maxAssists, 1))
		    .range(["#FFAAAA", "#D46A6A", "#AA3939", "#801515", "#550000"]);*/

		var y = d3.scale.ordinal()
			.domain([0, MessiViz.MATCHES.length])
		    .rangeBands([0, height-chartSize]);

		var x = d3.scale.linear()
			.domain(d3.range(0, maxAssists, 1))
		    .range([0,chartSize]);

		  y.domain(MessiViz.MATCHES.map(function(d,i) { return i; }));
		  x.domain([0, maxAssists]);

		  g.selectAll(".bar.bar-assist")
	    	.data(MessiViz.MATCHES)
	    	.enter().append("rect")
			.attr("class", function(d,i){
				return 'match'+i + ' ' +d.competition;
			})
			.classed("bar",true)
			.classed("bar-assist",true)
			.attr("x", function(d,i) { return width; })
			.attr("width", function(d) { return 0; })
			.attr("y", function(d,i) { return y(i); })
			.attr("height", y.rangeBand())
			.attr("fill", function(d,i) { return MessiViz.color(d.competition); })
			.transition()
			.delay(function (d, i) { return i*10; })
			.attr("width", function(d) { return x(d.assists); })
			.attr("x", function(d,i) { return width - x(d.assists); })
			;	

		  g.selectAll(".bar.bar-assist-fill")
	    	.data(MessiViz.MATCHES)
	    	.enter().append("rect")
			.classed("bar",true)
			.classed("bar-assist-fill",true)
			.attr("x", function(d,i) { return width - x(maxAssists); })
			.attr("width", function(d) { return x(maxAssists); })
			.attr("y", function(d,i) { return y(i); })
			.attr("height", y.rangeBand())
			.attr("fill", "transparent")
			.on('mouseover',function(d,i){
				MessiViz.hover(d,i);
			})
			.on('mouseout',function(d,i){
				MessiViz.unhover(d,i);
			});	

		// Minutes
		var g = MessiViz.svg.append("g").classed('minutes',true);
		var maxMinutes = 120;

		/*var color = d3.scale.threshold()
		    .domain([0,46,91,121])
		    .range(["#FFAAAA", "#D46A6A", "#AA3939", "#801515"]);*/

		var x = d3.scale.ordinal()
			.domain([0, MessiViz.MATCHES.length])
		    .rangeBands([chartSize, width-chartSize]);

		var y = d3.scale.linear()
			.domain(d3.range(0, maxMinutes, 1))
		    .range([0,chartSize]);

		  x.domain(MessiViz.MATCHES.map(function(d,i) { return i; }));
		  y.domain([0, maxMinutes]);

		var barsMinute = g.selectAll(".bar.bar-minute")
	    	.data(MessiViz.MATCHES)
	    	.enter().append("rect")
			.attr("class", function(d,i){
				return 'match'+i + ' ' +d.competition;
			})
			.classed("bar",true)
			.classed("bar-minute",true)
			.attr("x", function(d,i) { return x(i); })
			.attr("width", x.rangeBand )
			.attr("y", function(d,i) { return height })
			.attr("height",function(d) { return  0 })
			.attr("fill", function(d,i) { return MessiViz.color(d.competition); })
			.transition()
			.delay(function (d, i) { return i*10; })
	        .attr("y", function (d, i) { return height-y(d.minutes); })
	        .attr("height", function (d) { return y(d.minutes); });
			;

		  g.selectAll(".bar.bar-minute-fill")
	    	.data(MessiViz.MATCHES)
	    	.enter().append("rect")
			.classed("bar",true)
			.classed("bar-minute-fill",true)
			.attr("x", function(d,i) { return x(i); })
			.attr("width", x.rangeBand )
			.attr("y", function(d,i) { return height - y(maxMinutes); })
			.attr("height",function(d) { return  y(maxMinutes) })
			.attr("fill", "transparent")
			.on('mouseover',function(d,i){
				MessiViz.hover(d,i);
			})
			.on('mouseout',function(d,i){
				MessiViz.unhover(d,i);
			});

    };

    MessiViz.renderD3Totals = function(){
    	var g = MessiViz.svg.append("g").classed('competitions-group',true);
    	
    	g.selectAll("text.competition")
	    	.data(MessiViz.competitions)
	    	.enter()
	    	.append("text")
	    	.text(function(d){return d;})
			.classed("competition",true)
			.attr('y',function(d,i){return 0;})
			.attr('x',function(d,i){return 300;})
			.on('mouseover',function(competition){
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
			})
			.transition()
			.delay(function (d, i) { return i*10; })
	        .attr("y", function (d, i) { return i*20; });

    };

    MessiViz.hover = function(data,match){
    	MessiViz.SELECTED = match;
    	d3.selectAll('rect.match'+match).classed('selectedMatch', true);
    	var x = d3.select('rect.bar-minute.match'+match).attr('x');
    	MessiViz.linev.transition().attr('x1',x).attr('x2',x);
    	var y = d3.select('rect.bar-goal.match'+match).attr('y');
    	MessiViz.lineh.transition().attr('y1',y).attr('y2',y);
    	MessiViz.tooltip
    		.html(function(){
    			return '<p>'+data.home+'</p>' + 
    				'<p>'+data.away+'</p>' +
    				'<p>'+data.date+'</p>' +
    				'<p style="color:'+MessiViz.color(data.competition)+'"><strong>'+data.competition+'</strong></p>' +
    				'<p> Goals:'+data.goals+'</p>' +
    				'<p> Assists:'+data.assists+'</p>' +
    				'<p> Minutes:'+data.minutes+'</p>'
    				;
    		})
    		.transition()
    		.style('opacity','1')
    		.style('left',MessiViz.tooltipx(match)+'px')
    		.style('top',MessiViz.tooltipy(match)+'px');
    };

    MessiViz.unhover = function(data,match){
    	d3.selectAll('rect.bar').classed('selectedMatch',false);
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

		        default: return; // exit this handler for other keys
		    }
		    e.preventDefault(); // prevent the default action (scroll / move caret)
		});
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