
var MessiViz;
;(function(global, document, $, d3){

	"use strict";

    MessiViz = global.MessiViz = global.MessiViz || {};

    MessiViz.MATCHES;

    MessiViz.GOALS;

    MessiViz.team = "ARG";

    MessiViz.SELECTED = null;

    MessiViz.$loader = $('#loader-container');

    MessiViz.competitions = ["PRM", "CUP", "EUR", "FRN", "WCQ", "WCP", "SUP", "IUP", "CPA", "WCT"];
    
    MessiViz.competitionName = {
		"PRM":"La Liga española",
		"CUP":"Copa del Rey de España",
		"EUR":"UEFA Champions League",
		"FRN":"Amistoso internacional",
		"WCQ":"Eliminatorias para la copa del mundo",
		"WCP":"Copa del mundo",
		"SUP":"Super Copa de España",
		"IUP":"Super Copa de Europa UEFA",
		"CPA":"Copa América",
		"WCT":"Mundial de clubes"
    };

    MessiViz.hows = ["Left foot", "Right foot", "Head", "Hand", "Chest"];
    
    MessiViz.teams = ["Argentina", "FC Barcelona"];

	MessiViz.color = d3.scale.ordinal()
			    .domain(MessiViz.competitions)
			    .range(d3.scale.category10().range());

	MessiViz.colorHow = d3.scale.ordinal()
			    .domain(MessiViz.hows)
			    .range(d3.scale.category10().range());

	MessiViz.colorTeam = d3.scale.ordinal()
			    .domain(MessiViz.teams)
			    .range(d3.scale.category10().range());

    MessiViz.svg;

    MessiViz.groups = {};
    MessiViz.totals = {
    	$goals: 	$('.totals-goals'),
    	$assists: $('#totals-assists'),
    	$minutes: $('#totals-minutes'),
    	$matches: $('#totals-matches'),
    	$goalsLeft: $('#totals-goals-left'),
    	$goalsRight: $('#totals-goals-right'),
    	$goalsHead: $('#totals-goals-head'),
    	$goalsHand: $('#totals-goals-hand'),
    	$goalsChest: $('#totals-goals-chest'),
    	$goalsArg: $('#totals-goals-argentina'),
    	$goalsBar: $('#totals-goals-barcelona'),
    	$activeFilter: $('#active-filter'),
    	$iconFilter: $('#icon-filter'),
    	$messiContainer: $('#messi-container'),
    };

    MessiViz.barGap = {
    	x:0,
    	y:0
    };

    MessiViz.init = function(){

    	d3.csv('./data/messi-500-matches.csv',
    		function(data) {
    			MessiViz.MATCHES = data;
    			d3.csv('./data/messi-500-goals.csv',
		    		function(data) {
				  		MessiViz.GOALS = data;
						MessiViz.dataLoaded();
					}
				);
    		});

    	d3.xml("./images/messi-01.svg", "image/svg+xml", function(error, xml) {
		  if (error) throw error;
		  MessiViz.totals.$messiContainer.html(xml.documentElement);
		  	$('#messi-container svg path').each(function(i,e){
		  		var path = $(e);
		  		if(path.attr('fill')=="#49869D"){
		  			path.addClass("color1");
		  		} else if(path.attr('fill')=="#FFFFFF"){
		  			path.addClass("color2");
		  		}
		  	});
		  setInterval(function(){
		  	if(MessiViz.team=="ARG"){
		  		MessiViz.team="BAR";
		  		d3.selectAll('#messi-container svg path.color1').transition().duration(2000).attr('fill','#003173');
		  		d3.selectAll('#messi-container svg path.color2').transition().duration(2000).attr('fill','#831F3B');
		  	}else{
		  		MessiViz.team="ARG";
		  		d3.selectAll('#messi-container svg path.color1').transition().duration(2000).attr('fill','#49869D');
		  		d3.selectAll('#messi-container svg path.color2').transition().duration(2000).attr('fill','#FFFFFF');
		  	}
		  },5000);
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

    	MessiViz.renderD3Chart(MessiViz.MATCHES,2000);
		MessiViz.initEvents();
		MessiViz.hideTooltip();

    	//MessiViz.renderD3Filters();



    };

    MessiViz.renderD3Chart = function(DATA,delay){

    	//MessiViz.MATCHES = MessiViz.MATCHES.slice(0,100);
    	MessiViz.SELECTED_MATCHES = DATA.map(function(d,i){
    		d.index = i;
    	});

    	//SVG
    	if(!MessiViz.svg){

	    	MessiViz.margin = {top: 0, right: 0, bottom: 0, left: 0},
			MessiViz.width = $(window).width() - MessiViz.margin.left - MessiViz.margin.right,
			MessiViz.height = $(window).height() - MessiViz.margin.top - MessiViz.margin.bottom;
			MessiViz.chartSize = 100;

			$('.carousel-inner,.item').height(MessiViz.height-$('.masthead').height()-MessiViz.chartSize);

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
	                        .style("width", MessiViz.width/4+'px')
	                        .style("height", MessiViz.height/4+'px')
	                        .style("display", "block");

			MessiViz.$loader.fadeOut(2000);

    	}

		MessiViz.tooltipx = d3.scale.linear()
			.domain([0, MessiViz.SELECTED_MATCHES.length])
		    .range([MessiViz.chartSize,MessiViz.width-MessiViz.width/4-MessiViz.chartSize]);

		MessiViz.tooltipy = d3.scale.linear()
			.domain([0, MessiViz.SELECTED_MATCHES.length])
		    .range([0,MessiViz.height - MessiViz.height/4-MessiViz.chartSize]);

    	delay = (delay)?delay:0; 

    	MessiViz.renderGoals(DATA,delay);
    	MessiViz.renderAssists(DATA,delay);
    	MessiViz.renderMinutes(DATA,delay);
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

    MessiViz.renderGoals = function (DATA,delay){

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
			.classed("bar-unit",true)
			.classed("bar-goal",true)
			.transition()
			.delay(function (d, i) { return i*5 + delay; })
			.attr("fill", '#ddd')
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

    MessiViz.renderAssists = function (DATA,delay){

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
			.classed("bar-unit",true)
			.classed("bar-assist",true).transition()
			.delay(function (d, i) { return i*5 + delay; })
			.attr("fill", '#ddd')
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

    MessiViz.renderMinutes = function (DATA,delay){

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
			.classed("bar-unit",true)
			.classed("bar-minute",true)
			.transition()
			.delay(function (d, i) { return i*5 + delay; })
			.attr("fill", '#ddd')
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

    	console.log(data);
    	MessiViz.SELECTED = data.id;
    	d3.selectAll('rect.match'+data.id).classed('selectedMatch', true);
    	d3.selectAll('circle.match'+data.id).classed('selectedGoal', true);
    	var x = d3.select('rect.bar-minute.match'+data.id).attr('x');
    	MessiViz.linev.transition().style('opacity',1).attr('x1',Math.round(x)+Math.round(MessiViz.barGap.x/2)).attr('x2',Math.round(x)+Math.round(MessiViz.barGap.x/2));
    	var y = d3.select('rect.bar-goal.match'+data.id).attr('y');
    	MessiViz.lineh.transition().style('opacity',1).attr('y1',Math.round(y)+Math.round(MessiViz.barGap.y/2)).attr('y2',Math.round(y)+Math.round(MessiViz.barGap.y/2));
    	MessiViz.tooltip
    		.html(function(){
    			var winner = (data.home_goals>data.away_goals)?'home':'away';
    			var looser = (data.home_goals<data.away_goals)?'home':'away';
    			var text =  '<p>'+
    						'El día <strong>'+data.date+'</strong>, '+
    						'<strong>'+data.home+'</strong> recibió a <strong>'+data.away+'</strong> '+
    						'por <strong>'+MessiViz.competitionName[data.competition]+'</strong>.';

    			if(winner==looser){
    				text += ' Fue empate ';
    			} else if(looser=='home'){
    				text += ' Fue victoria para los visitantes ';
    			} else {
    				text += ' Los locales se impusieron ';
    			}
    			text += '<strong>'+data.home_goals+'-'+data.away_goals+'</strong>.';

    			if(data.goals==0){
    				text+=' Messi no marcó goles';
    			} else if(data.goals==1){
    				text+=' Messi marcó <strong>un</strong> gol en el minuto '+data.details[0].minute;
    			} else {
    				text+=' Messi marcó <strong>'+data.goals+'</strong> goles';
    			}

    			if(data.assists==0){
    				text+=', no hizo asistencias';
    			} else if(data.assists==1){
    				text+=', realizó <strong>una</strong> asistencia';
    			} else {
    				text+=', sumó <strong>'+data.assists+'</strong> asistencias';
    			}

    			if(data.minutes>=90){
    				text+=', jugando el partido completo';
    				if(data.minutes==120){
    					text+=' mas el alargue';
    				}
    				text+='.';
    			} else if(data.minutes<45){
    				text+=', jugando apenas <strong>'+data.minutes+'</strong> minutos.';
    			} else {
    				text+=', participando <strong>'+data.minutes+'</strong> minutos.';
    			}

    			return text+'</p>';

    		})
    		.transition()
    		.style('opacity','1')
    		.style('left',MessiViz.tooltipx(data.index)+'px')
    		.style('top',MessiViz.tooltipy(data.index)+'px');
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
			MessiViz.totals.$activeFilter.html($filter.html());
			MessiViz.totals.$iconFilter.fadeOut();
			$filter.parent().addClass('disabled').siblings().removeClass('disabled');
			MessiViz.hideTooltip();
			MessiViz.filter($filter.data('field'),$filter.data('filter'));
		});

		$('#clear-filter').on('click',function(){
			MessiViz.totals.$activeFilter.html('total');
			MessiViz.totals.$iconFilter.fadeIn();
			$('.btn-filter').parent().removeClass('disabled');
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
			MessiViz.clearBars();
		});

		$('svg-container').mouseenter(function(){
			MessiViz.showBars();
		});

		$('#carousel-messi').on('slid.bs.carousel', function (event) {
		  	var id = $(event.relatedTarget).attr('id');
		  	if(id=='item-home'){
		  		MessiViz.hideForceLayout()
		  	} else {
		  		MessiViz.renderForceLayout();
		  	}
		  	if(id=='item-goals'){
		  		MessiViz.goalsByHow();
		  	}
		  	if(id=='item-teams'){
		  		MessiViz.goalsByTeam();
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
			.attr("fill", '#111')
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

    MessiViz.goalsByHow = function(){
    	$('#item-goals h4').each(function(d){
    		var h = $(this);
    		h.css('color',MessiViz.colorHow(h.data('how')));
    	});

    	MessiViz.groups.forceLayout.selectAll("circle.goal")
    		.attr('fill',function(d){
    			return MessiViz.colorHow(d.how);
    		});
    };

    MessiViz.goalsByTeam = function(){
    	$('#item-teams h4').each(function(d){
    		var h = $(this);
    		h.css('color',MessiViz.colorTeam(h.data('team')));
    	});

    	MessiViz.groups.forceLayout.selectAll("circle.goal")
    		.attr('fill',function(d){
    			return MessiViz.colorTeam(d.team);
    		});
    };


    MessiViz.hideForceLayout = function(){
    	MessiViz.groups.forceLayout.selectAll("circle.goal")
    		.transition().attr('r',0).remove();
    };

    MessiViz.clearBars = function(){
    	d3.selectAll("rect.bar-unit").attr('fill','#ddd');
    };

    MessiViz.showBars = function(){
    	d3.selectAll('rect.bar-unit').attr("fill", function(d,i) { return MessiViz.color(d.competition); });
    };

	MessiViz.updateTotals = function(DATA){

		var goals=0,
			assists=0,
			minutes=0,
			arg=0,
			bar=0,
			arg_goals=0,
			bar_goals=0,
			matches=DATA.length;

		MessiViz.GOALS_SELECTED = [];

		DATA.forEach(function(data){
			goals+=parseInt(data.goals);
			assists+=parseInt(data.assists);
			minutes+=parseInt(data.minutes);
			if(data.team=="Argentina"){
				arg++;
				if(data.goals>0){
					arg_goals += parseInt(data.goals);
				}
			} else {
				bar++;
				if(data.goals>0){
					bar_goals += parseInt(data.goals);
				}
			}
			if(data.details.length){
				MessiViz.GOALS_SELECTED = _.concat(MessiViz.GOALS_SELECTED,data.details.map(function(d){d.match_id=data.id;d.team=data.team;return d;}));
			}
		});

		MessiViz.updateGoals();

		MessiViz.totals.$goals.countTo({
			from: parseInt(MessiViz.totals.$goals.html()), 
			to: goals,
			speed: 1000,
			formatter: function (value, options) {
      			return value.toFixed(options.decimals);
    		}
		});

		MessiViz.totals.$assists.countTo({
			from: parseInt(MessiViz.totals.$assists.html()), 
			to: assists,
			speed: 1000,
			formatter: function (value, options) {
      			return value.toFixed(options.decimals);
    		}
		});

		MessiViz.totals.$minutes.countTo({
			from: parseInt(MessiViz.totals.$minutes.html()), 
			to: minutes,
			speed: 1000,
			formatter: function (value, options) {
      			return value.toFixed(options.decimals);
    		}
		});

		MessiViz.totals.$matches.countTo({
			from: parseInt(MessiViz.totals.$matches.html()), 
			to: matches,
			speed: 1000,
			formatter: function (value, options) {
      			return value.toFixed(options.decimals);
    		}
		});

		MessiViz.totals.$goalsArg.countTo({
			from: parseInt(MessiViz.totals.$goalsArg.html()), 
			to: arg_goals,
			speed: 1000,
			formatter: function (value, options) {
      			return value.toFixed(options.decimals);
    		}
		});

		MessiViz.totals.$goalsBar.countTo({
			from: parseInt(MessiViz.totals.$goalsBar.html()), 
			to: bar_goals,
			speed: 1000,
			formatter: function (value, options) {
      			return value.toFixed(options.decimals);
    		}
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
			speed: 1000,
			formatter: function (value, options) {
      			return value.toFixed(options.decimals);
    		}
		});

		MessiViz.totals.$goalsRight.countTo({
			from: parseInt(MessiViz.totals.$goalsRight.html()), 
			to: (goalsHow["Right foot"])?goalsHow["Right foot"].length:0,
			speed: 1000,
			formatter: function (value, options) {
      			return value.toFixed(options.decimals);
    		}
		});

		MessiViz.totals.$goalsHead.countTo({
			from: parseInt(MessiViz.totals.$goalsHead.html()), 
			to: (goalsHow["Head"])?goalsHow["Head"].length:0,
			speed: 1000,
			formatter: function (value, options) {
      			return value.toFixed(options.decimals);
    		}
		});

		MessiViz.totals.$goalsChest.countTo({
			from: parseInt(MessiViz.totals.$goalsChest.html()), 
			to: (goalsHow["Chest"])?goalsHow["Chest"].length:0,
			speed: 1000,
			formatter: function (value, options) {
      			return value.toFixed(options.decimals);
    		}
		});

		MessiViz.totals.$goalsHand.countTo({
			from: parseInt(MessiViz.totals.$goalsHand.html()), 
			to: (goalsHow["Hand"])?goalsHow["Hand"].length:0,
			speed: 1000,
			formatter: function (value, options) {
      			return value.toFixed(options.decimals);
    		}
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

})(window, document,jQuery, d3);