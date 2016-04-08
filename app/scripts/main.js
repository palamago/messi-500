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

    MessiViz.groups = {};

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

    	MessiViz.renderD3Totals();

    	MessiViz.initEvents();

    	MessiViz.$loader.fadeOut();

    };

    MessiViz.renderD3Chart = function(DATA){

    	//MessiViz.MATCHES = MessiViz.MATCHES.slice(0,100);

    	//SVG
    	if(!MessiViz.svg){

	    	MessiViz.margin = {top: 0, right: 0, bottom: 0, left: 0},
			MessiViz.width = $(window).width() - MessiViz.margin.left - MessiViz.margin.right,
			MessiViz.height = $(window).height() - MessiViz.margin.top - MessiViz.margin.bottom;
			MessiViz.chartSize = 100;

			MessiViz.svg = d3.select("body").append("svg")
			    .attr("width", MessiViz.width + MessiViz.margin.left + MessiViz.margin.right)
			    .attr("height", MessiViz.height + MessiViz.margin.top + MessiViz.margin.bottom)
			  	.append("g")
			    .attr("transform", "translate(" + MessiViz.margin.left + "," + MessiViz.margin.top + ")");
    		
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

			MessiViz.color = d3.scale.ordinal()
			    .domain(MessiViz.competitions)
			    .range(d3.scale.category10().range());
			
    	}

    	MessiViz.renderGoals(DATA);
    	MessiViz.renderAssists(DATA);
    	MessiViz.renderMinutes(DATA);

    };

    MessiViz.renderGoals = function (DATA){

    	if(!MessiViz.groups.goals){
    		MessiViz.groups.goals = MessiViz.svg.append("g").classed('goals',true);
    		MessiViz.maxGoals = d3.max(DATA, function(d) { return d.goals; });
    	}

		var y = d3.scale.ordinal()
			.domain([0, DATA.length])
		    .rangeBands([0, MessiViz.height-MessiViz.chartSize]);

		var x = d3.scale.linear()
			.domain(d3.range(0, 6, 1))
		    .range([0,MessiViz.chartSize]);

		y.domain(DATA.map(function(d,i) { return i; }));
		x.domain([0, MessiViz.maxGoals]);

		var bars = MessiViz.groups.goals.selectAll(".bar.bar-goal")
	    	.data(DATA)

	   	bars.exit().remove();

	   	bars.enter()
	    	.append("rect")
			.attr("class", function(d,i){
				return 'match'+d.id + ' ' +d.competition;
			})
			.classed("bar",true)
			.classed("bar-goal",true)
			.attr("fill", function(d,i) { return MessiViz.color(d.competition); })
			.attr("x", function(d,i) { return 0; })
			.attr("width", function(d) { return 0; });
			
		bars.transition()
			.attr("y", function(d,i) { return y(i); })
			.attr("height", y.rangeBand())
			.transition()
			.delay(function (d, i) { return i*5; })
			.attr("width", function(d) { return x(d.goals); });	

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
			.on('mouseover',function(d){
				MessiViz.hover(d);
			})
			.on('mouseout',function(d){
				MessiViz.unhover(d);
			});	
			
		bars.attr("y", function(d,i) { return y(i); })
			.attr("height", y.rangeBand());

    };

    MessiViz.renderAssists = function (DATA){

    	if(!MessiViz.groups.assists){
    		MessiViz.groups.assists = MessiViz.svg.append("g").classed('assists',true);
			MessiViz.maxAssists = d3.max(DATA, function(d) { return d.assists; });
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
			.attr("class", function(d,i){
				return 'match'+d.id + ' ' +d.competition;
			})
			.classed("bar",true)
			.classed("bar-assist",true)
			.attr("x", function(d,i) { return MessiViz.width; })
			.attr("width", function(d) { return 0; })
			.attr("fill", function(d,i) { return MessiViz.color(d.competition); });
		
		bars.transition()
			.attr("y", function(d,i) { return y(i); })
			.attr("height", y.rangeBand())
			.delay(function (d, i) { return i*10; })
			.attr("width", function(d) { return x(d.assists); })
			.attr("x", function(d,i) { return MessiViz.width - x(d.assists); });	



		var bars = MessiViz.groups.goals.selectAll(".bar.bar-assist-fill")
	    	.data(DATA)

	   	bars.exit().remove();

	   	bars.enter()
	    	.append("rect")
			.classed("bar",true)
			.classed("bar-assist-fill",true)
			.attr("fill", "transparent")
			.attr("x", function(d,i) { return MessiViz.width - x(MessiViz.maxAssists); })
			.attr("width", function(d) { return x(MessiViz.maxAssists); })
			.on('mouseover',function(d){
				MessiViz.hover(d);
			})
			.on('mouseout',function(d){
				MessiViz.unhover(d);
			});	
			
		bars.attr("y", function(d,i) { return y(i); })
			.attr("height", y.rangeBand());

    };

    MessiViz.renderMinutes = function (DATA){

    	if(!MessiViz.groups.minutes){
    		MessiViz.groups.minutes = MessiViz.svg.append("g").classed('minutes',true);
			MessiViz.maxMinutes = d3.max(DATA, function(d) { return parseInt(d.minutes); });
    	}


		var x = d3.scale.ordinal()
			.domain([0, DATA.length])
		    .rangeBands([MessiViz.chartSize, MessiViz.width-MessiViz.chartSize]);

		var y = d3.scale.linear()
			.domain(d3.range(0, MessiViz.maxMinutes, 1))
		    .range([0,MessiViz.chartSize]);

		  x.domain(DATA.map(function(d,i) { return i; }));
		  y.domain([0, MessiViz.maxMinutes]);

		var bars = MessiViz.groups.minutes.selectAll(".bar.bar-minute")
	    	.data(DATA)

	   	bars.exit().remove();

	   	bars.enter()
			.append("rect")
			.attr("class", function(d,i){
				return 'match'+d.id + ' ' +d.competition;
			})
			.classed("bar",true)
			.classed("bar-minute",true)
			.attr("y", function(d,i) { return MessiViz.height })
			.attr("height",function(d) { return  0 })
			.attr("fill", function(d,i) { return MessiViz.color(d.competition); });
			
		bars.transition()
			.attr("x", function(d,i) { return x(i); })
			.attr("width", x.rangeBand())
			.delay(function (d, i) { return i*10; })
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
			.attr("height", function(d) { return  y(MessiViz.maxMinutes) })
			.on('mouseover',function(d){
				MessiViz.hover(d);
			})
			.on('mouseout',function(d){
				MessiViz.unhover(d);
			});	
			
		bars.attr("width", x.rangeBand())
			.attr("x", function(d,i) { return x(i); });

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
			.on('click',function(d){
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
	        .attr("y", function (d, i) { return i*20; });

    };

    MessiViz.hover = function(data){
    	MessiViz.SELECTED = data.id;
    	d3.selectAll('rect.match'+data.id).classed('selectedMatch', true);
    	var x = d3.select('rect.bar-minute.match'+data.id).attr('x');
    	MessiViz.linev.transition().attr('x1',x).attr('x2',x);
    	var y = d3.select('rect.bar-goal.match'+data.id).attr('y');
    	MessiViz.lineh.transition().attr('y1',y).attr('y2',y);
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