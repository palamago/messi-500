"use strict";var MessiViz;!function(s,t,i,e){MessiViz=s.MessiViz=s.MessiViz||{},MessiViz.MATCHES,MessiViz.GOALS,MessiViz.SELECTED=null,MessiViz.$loader=i("#loader-container"),MessiViz.competitions=["PRM","CUP","EUR","FRN","WCQ","WCP","SUP","IUP","CPA","WCT"],MessiViz.competitionName={PRM:"La Liga española",CUP:"Copa del Rey de España",EUR:"UEFA Champions League",FRN:"Amistoso internacional",WCQ:"Eliminatorias para la copa del mundo",WCP:"Copa del mundo",SUP:"Super Copa de España",IUP:"Super Copa de Europa UEFA",CPA:"Copa América",WCT:"Mundial de clubes"},MessiViz.hows=["Left foot","Right foot","Head","Hand","Chest"],MessiViz.teams=["Argentina","FC Barcelona"],MessiViz.color=e.scale.ordinal().domain(MessiViz.competitions).range(e.scale.category10().range()),MessiViz.colorHow=e.scale.ordinal().domain(MessiViz.hows).range(e.scale.category10().range()),MessiViz.colorTeam=e.scale.ordinal().domain(MessiViz.teams).range(e.scale.category10().range()),MessiViz.svg,MessiViz.groups={},MessiViz.totals={$goals:i(".totals-goals"),$assists:i("#totals-assists"),$minutes:i("#totals-minutes"),$matches:i("#totals-matches"),$goalsLeft:i("#totals-goals-left"),$goalsRight:i("#totals-goals-right"),$goalsHead:i("#totals-goals-head"),$goalsHand:i("#totals-goals-hand"),$goalsChest:i("#totals-goals-chest"),$goalsArg:i("#totals-goals-argentina"),$goalsBar:i("#totals-goals-barcelona"),$activeFilter:i("#active-filter"),$iconFilter:i("#icon-filter")},MessiViz.barGap={x:0,y:0},MessiViz.init=function(){e.csv("./data/messi-500-matches.csv",function(s){MessiViz.MATCHES=s,e.csv("./data/messi-500-goals.csv",function(s){MessiViz.GOALS=s,MessiViz.dataLoaded()})})},MessiViz.dataLoaded=function(){var s=e.nest().key(function(s){return s.date}).map(MessiViz.GOALS);_.forEach(MessiViz.MATCHES,function(t){s[t.date]?t.details=s[t.date]:t.details=[]}),MessiViz.renderD3Chart(MessiViz.MATCHES,2e3),MessiViz.initEvents(),MessiViz.hideTooltip()},MessiViz.renderD3Chart=function(s,t){MessiViz.SELECTED_MATCHES=s.map(function(s,t){s.index=t}),MessiViz.svg||(MessiViz.margin={top:0,right:0,bottom:0,left:0},MessiViz.width=i(window).width()-MessiViz.margin.left-MessiViz.margin.right,MessiViz.height=i(window).height()-MessiViz.margin.top-MessiViz.margin.bottom,MessiViz.chartSize=100,i(".carousel-inner,.item").height(MessiViz.height-i(".masthead").height()-MessiViz.chartSize),MessiViz.svg=e.select("#svg-container").append("svg").attr("width",MessiViz.width+MessiViz.margin.left+MessiViz.margin.right).attr("height",MessiViz.height+MessiViz.margin.top+MessiViz.margin.bottom).append("g").attr("transform","translate("+MessiViz.margin.left+","+MessiViz.margin.top+")"),MessiViz.tooltip=e.select("body").append("div").classed("info-tooltip",!0).style("top",0).style("left",0).style("width",MessiViz.width/4+"px").style("height",MessiViz.height/4+"px").style("display","block"),MessiViz.$loader.fadeOut(2e3)),MessiViz.tooltipx=e.scale.linear().domain([0,MessiViz.SELECTED_MATCHES.length]).range([MessiViz.chartSize,MessiViz.width-MessiViz.width/4-MessiViz.chartSize]),MessiViz.tooltipy=e.scale.linear().domain([0,MessiViz.SELECTED_MATCHES.length]).range([0,MessiViz.height-MessiViz.height/4-MessiViz.chartSize]),t=t?t:0,MessiViz.renderGoals(s,t),MessiViz.renderAssists(s,t),MessiViz.renderMinutes(s,t),MessiViz.updateTotals(s),MessiViz.lineh||(MessiViz.lineh=MessiViz.svg.append("line").classed("lineh",!0).attr("x1",0).attr("y1",0).attr("x2",MessiViz.width).attr("y2",0),MessiViz.linev=MessiViz.svg.append("line").classed("linev",!0).attr("x1",0).attr("y1",0).attr("x2",0).attr("y2",MessiViz.height))},MessiViz.renderGoals=function(s,t){MessiViz.groups.goals||(MessiViz.groups.goals=MessiViz.svg.append("g").classed("goals",!0),MessiViz.maxGoals=e.max(s,function(s){return s.goals}),MessiViz.totals.goals=MessiViz.groups.goals.append("text").text(function(s){return""}).classed("totals-number",!0).attr("id","totals-number-goals").attr("y",function(s,t){return MessiViz.height/2}).attr("x",function(s,t){return(MessiViz.width-2*MessiViz.chartSize)/4}).attr("text-anchor","middle"),MessiViz.groups.goals.append("text").text(function(s){return"GOLES"}).classed("totals-label",!0).attr("y",function(s,t){return 0}).attr("x",function(s,t){return MessiViz.height/2-MessiViz.chartSize/2}).attr("text-anchor","middle").attr("transform","rotate(90)"));var i=e.scale.ordinal().domain([0,s.length]).rangeBands([0,MessiViz.height-MessiViz.chartSize]),a=e.scale.linear().domain(e.range(0,6,1)).range([0,MessiViz.chartSize]);i.domain(s.map(function(s,t){return t})),a.domain([0,MessiViz.maxGoals]),MessiViz.barGap.y=i.rangeBand();var n=MessiViz.groups.goals.selectAll(".bar.bar-goal").data(s);n.exit().remove(),n.enter().append("rect").attr("x",function(s,t){return 0}).attr("width",function(s){return 0}),n.attr("class",function(s,t){return"match"+s.id+" "+s.competition}).classed("bar",!0).classed("bar-unit",!0).classed("bar-goal",!0).transition().delay(function(s,i){return 5*i+t}).attr("fill","#ddd").attr("y",function(s,t){return i(t)}).attr("height",i.rangeBand()).attr("width",function(s){return 0==a(s.goals)?2:a(s.goals)});var n=MessiViz.groups.goals.selectAll(".bar.bar-goal-fill").data(s);n.exit().remove(),n.enter().append("rect").classed("bar",!0).classed("bar-goal-fill",!0).attr("fill","transparent").attr("x",function(s,t){return 0}).attr("width",function(s){return a(MessiViz.maxGoals)}),n.attr("y",function(s,t){return i(t)}).attr("height",i.rangeBand()).on("mouseover",function(s){MessiViz.hover(s)}).on("mouseout",function(s){MessiViz.unhover(s)})},MessiViz.renderAssists=function(s,t){MessiViz.groups.assists||(MessiViz.groups.assists=MessiViz.svg.append("g").classed("assists",!0),MessiViz.maxAssists=e.max(s,function(s){return s.assists}),MessiViz.totals.assists=MessiViz.groups.assists.append("text").text(function(s){return""}).classed("totals-number",!0).attr("id","totals-number-assists").attr("y",function(s,t){return MessiViz.height/2}).attr("x",function(s,t){return MessiViz.width-MessiViz.chartSize-(MessiViz.width-2*MessiViz.chartSize)/4}).attr("text-anchor","middle"),MessiViz.groups.assists.append("text").text(function(s){return"ASISTENCIAS"}).classed("totals-label-assists",!0).attr("y",function(s,t){return MessiViz.width}).attr("x",function(s,t){return-MessiViz.height/2+MessiViz.chartSize/2}).attr("text-anchor","middle").attr("transform","rotate(270)"));var i=e.scale.ordinal().domain([0,s.length]).rangeBands([0,MessiViz.height-MessiViz.chartSize]),a=e.scale.linear().domain(e.range(0,MessiViz.maxAssists,1)).range([0,MessiViz.chartSize]);i.domain(s.map(function(s,t){return t})),a.domain([0,MessiViz.maxAssists]);var n=MessiViz.groups.assists.selectAll(".bar.bar-assist").data(s);n.exit().remove(),n.enter().append("rect").attr("x",function(s,t){return MessiViz.width}).attr("width",function(s){return 0}),n.attr("class",function(s,t){return"match"+s.id+" "+s.competition}).classed("bar",!0).classed("bar-unit",!0).classed("bar-assist",!0).transition().delay(function(s,i){return 5*i+t}).attr("fill","#ddd").attr("y",function(s,t){return i(t)}).attr("height",i.rangeBand()).attr("width",function(s){return 0==a(s.assists)?2:a(s.assists)}).attr("x",function(s,t){var i=0==a(s.assists)?2:a(s.assists);return MessiViz.width-i});var n=MessiViz.groups.assists.selectAll(".bar.bar-assist-fill").data(s);n.exit().remove(),n.enter().append("rect").classed("bar",!0).classed("bar-assist-fill",!0).attr("fill","transparent").attr("x",function(s,t){return MessiViz.width-a(MessiViz.maxAssists)}).attr("width",function(s){return a(MessiViz.maxAssists)}),n.attr("y",function(s,t){return i(t)}).attr("height",i.rangeBand()).on("mouseover",function(s){MessiViz.hover(s)}).on("mouseout",function(s){MessiViz.unhover(s)})},MessiViz.renderMinutes=function(s,t){MessiViz.groups.minutes||(MessiViz.groups.minutes=MessiViz.svg.append("g").classed("minutes",!0),MessiViz.maxMinutes=e.max(s,function(s){return parseInt(s.minutes)}),MessiViz.totals.minutes=MessiViz.groups.minutes.append("text").text(function(s){return""}).classed("totals-number",!0).attr("id","totals-number-minutes").attr("y",function(s,t){return MessiViz.height/2}).attr("x",function(s,t){return MessiViz.width/2}).attr("text-anchor","middle"),MessiViz.totals.matches=MessiViz.groups.minutes.append("text").text(function(s){return""}).classed("totals-number",!0).attr("id","totals-number-matches").attr("y",function(s,t){return MessiViz.height/2+200}).attr("x",function(s,t){return MessiViz.width/2}).attr("text-anchor","middle"),MessiViz.groups.minutes.append("text").text(function(s){return"MINUTOS"}).classed("totals-label",!0).attr("y",function(s,t){return MessiViz.height}).attr("x",function(s,t){return MessiViz.width/2}).attr("text-anchor","middle"));var i=e.scale.ordinal().domain([0,s.length]).rangeBands([MessiViz.chartSize,MessiViz.width-MessiViz.chartSize]),a=e.scale.linear().domain(e.range(0,MessiViz.maxMinutes,1)).range([0,MessiViz.chartSize]);i.domain(s.map(function(s,t){return t})),a.domain([0,MessiViz.maxMinutes]),MessiViz.barGap.x=i.rangeBand();var n=MessiViz.groups.minutes.selectAll(".bar.bar-minute").data(s);n.exit().remove(),n.enter().append("rect").attr("y",function(s,t){return MessiViz.height}).attr("height",function(s){return 0}),n.attr("class",function(s,t){return"match"+s.id+" "+s.competition}).classed("bar",!0).classed("bar-unit",!0).classed("bar-minute",!0).transition().delay(function(s,i){return 5*i+t}).attr("fill","#ddd").attr("x",function(s,t){return i(t)}).attr("width",i.rangeBand()).attr("y",function(s,t){return MessiViz.height-a(s.minutes)}).attr("height",function(s){return a(s.minutes)});var n=MessiViz.groups.minutes.selectAll(".bar.bar-minute-fill").data(s);n.exit().remove(),n.enter().append("rect").classed("bar",!0).classed("bar-minute-fill",!0).attr("fill","transparent").attr("y",function(s,t){return MessiViz.height-a(MessiViz.maxMinutes)}).attr("height",function(s){return a(MessiViz.maxMinutes)}),n.attr("width",i.rangeBand()).attr("x",function(s,t){return i(t)}).on("mouseover",function(s){MessiViz.hover(s)}).on("mouseout",function(s){MessiViz.unhover(s)})},MessiViz.renderD3Filters=function(){var s=MessiViz.svg.append("g").classed("competitions-group",!0);s.selectAll("text.competition").data(MessiViz.competitions).enter().append("text").text(function(s){return s}).classed("competition",!0).attr("y",function(s,t){return 100}).attr("x",function(s,t){return 300}).attr("text-anchor","middle").on("click",function(s){MessiViz.hideTooltip(),MessiViz.filter("competition",s)}).transition().delay(function(s,t){return 10*t}).attr("y",function(s,t){return 100+20*t})},MessiViz.hover=function(s){MessiViz.SELECTED=s.id,e.selectAll("rect.match"+s.id).classed("selectedMatch",!0),e.selectAll("circle.match"+s.id).classed("selectedGoal",!0);var t=e.select("rect.bar-minute.match"+s.id).attr("x");MessiViz.linev.transition().style("opacity",1).attr("x1",Math.round(t)+Math.round(MessiViz.barGap.x/2)).attr("x2",Math.round(t)+Math.round(MessiViz.barGap.x/2));var i=e.select("rect.bar-goal.match"+s.id).attr("y");MessiViz.lineh.transition().style("opacity",1).attr("y1",Math.round(i)+Math.round(MessiViz.barGap.y/2)).attr("y2",Math.round(i)+Math.round(MessiViz.barGap.y/2)),MessiViz.tooltip.html(function(){var t=s.home_goals>s.away_goals?"home":"away",i=s.home_goals<s.away_goals?"home":"away",e="<p>El día <strong>"+s.date+"</strong>, <strong>"+s.home+"</strong> recibió a <strong>"+s.away+"</strong> por <strong>"+MessiViz.competitionName[s.competition]+"</strong>.";return e+=t==i?" Fue empate ":"home"==i?" Fue victoria para los visitantes ":" Los locales se impusieron ",e+="<strong>"+s.home_goals+"-"+s.away_goals+"</strong>.",e+=0==s.goals?" Messi no marcó goles":1==s.goals?" Messi marcó <strong>"+un+"</strong> gol en el minuto "+s.details[0].minute:" Messi marcó <strong>"+s.goals+"</strong> goles",e+=0==s.assists?", no hizo asistencias":1==s.assists?", realizó <strong>una</strong> asistencia":", sumó <strong>"+s.assists+"</strong> asistencias",s.minutes>=90?(e+=", jugando el partido completo",120==s.minutes&&(e+=" mas el alargue"),e+="."):e+=s.minutes<45?", jugando apenas <strong>"+s.minutes+"</strong> minutos.":", participando <strong>"+s.minutes+"</strong> minutos.",e+"</p>"}).transition().style("opacity","1").style("left",MessiViz.tooltipx(s.index)+"px").style("top",MessiViz.tooltipy(s.index)+"px")},MessiViz.unhover=function(s,t){e.selectAll("rect.bar").classed("selectedMatch",!1),e.selectAll("circle.goal").classed("selectedGoal",!1)},MessiViz.hideTooltip=function(s,t){MessiViz.tooltip.transition().style("opacity","0"),MessiViz.linev.transition().attr("x1",0).attr("x2",MessiViz.width).style("opacity",0),MessiViz.lineh.transition().attr("y1",MessiViz.height).attr("y2",0).style("opacity",0)},MessiViz.initEvents=function(){i(t).keydown(function(s){switch(s.which){case 37:case 38:MessiViz.prev();break;case 39:case 40:MessiViz.next();break;case 27:MessiViz.hideTooltip();break;default:return}s.preventDefault()}),i(".btn-filter").on("click",function(){var s=i(this);MessiViz.totals.$activeFilter.html(s.html()),MessiViz.totals.$iconFilter.fadeOut(),s.parent().addClass("disabled").siblings().removeClass("disabled"),MessiViz.hideTooltip(),MessiViz.filter(s.data("field"),s.data("filter"))}),i("#clear-filter").on("click",function(){MessiViz.totals.$activeFilter.html(""),MessiViz.totals.$iconFilter.fadeIn(),i(".btn-filter").parent().removeClass("disabled"),MessiViz.clear()}),i("#filtersModal").on("show.bs.modal",function(s){MessiViz.hideTooltip()}),i("#carousel-messi").carousel({interval:!1}).off("keydown.bs.carousel"),i(".container").mouseenter(function(){MessiViz.hideTooltip(),MessiViz.clearBars()}),i("svg").mouseenter(function(){MessiViz.showBars()}),i("#carousel-messi").on("slid.bs.carousel",function(s){var t=i(s.relatedTarget).attr("id");"item-home"==t?MessiViz.hideForceLayout():MessiViz.renderForceLayout(),"item-goals"==t&&MessiViz.goalsByHow(),"item-teams"==t&&MessiViz.goalsByTeam()})},MessiViz.renderForceLayout=function(){function s(s){var t=s.radius+20,i=s.x-t,e=s.x+t,a=s.y-t,n=s.y+t;return function(t,r,o,l,c){if(t.point&&t.point!==s){var u=s.x-t.point.x,d=s.y-t.point.y,M=Math.sqrt(u*u+d*d),z=s.radius+t.point.radius;z>M&&(M=(M-z)/M*.5,s.x-=u*=M,s.y-=d*=M,t.point.x+=u,t.point.y+=d)}return r>e||i>l||o>n||a>c}}var t=MessiViz.GOALS_SELECTED.map(function(s){return s.radius=8,s});t.unshift({radius:0,fixed:!0});var i=e.layout.force().gravity(.08).charge(function(s,t){return s.fixed?0:-10}).nodes(t).size([MessiViz.width,MessiViz.height]);MessiViz.groups.forceLayout||(MessiViz.groups.forceLayout=MessiViz.svg.append("g").classed("force-layout",!0)),i.start();var a=MessiViz.groups.forceLayout.selectAll("circle.goal").data(t.slice(1));a.exit().remove(),a.enter().append("svg:circle").attr("r",function(s){return s.radius}).attr("cx",0).attr("cy",0),a.attr("fill","#111").attr("class",function(s){return"match"+s.match_id}).classed("goal",!0),i.on("tick",function(i){t[0].x=MessiViz.width/2,t[0].y=MessiViz.height/2;for(var a=e.geom.quadtree(t),n=0,r=t.length;++n<r;)a.visit(s(t[n]));MessiViz.groups.forceLayout.selectAll("circle.goal").attr("cx",function(s){return s.x}).attr("cy",function(s){return s.y})}),i.resume()},MessiViz.goalsByHow=function(){i("#item-goals h4").each(function(s){var t=i(this);t.css("color",MessiViz.colorHow(t.data("how")))}),MessiViz.groups.forceLayout.selectAll("circle.goal").attr("fill",function(s){return MessiViz.colorHow(s.how)})},MessiViz.goalsByTeam=function(){i("#item-teams h4").each(function(s){var t=i(this);t.css("color",MessiViz.colorTeam(t.data("team")))}),MessiViz.groups.forceLayout.selectAll("circle.goal").attr("fill",function(s){return MessiViz.colorTeam(s.team)})},MessiViz.hideForceLayout=function(){MessiViz.groups.forceLayout.selectAll("circle.goal").transition().attr("r",0).remove()},MessiViz.clearBars=function(){e.selectAll("rect.bar-unit").attr("fill","#ddd")},MessiViz.showBars=function(){e.selectAll("rect.bar-unit").attr("fill",function(s,t){return MessiViz.color(s.competition)})},MessiViz.updateTotals=function(s){var t=0,i=0,e=0,a=0,n=0,r=0,o=0,l=s.length;MessiViz.GOALS_SELECTED=[],s.forEach(function(s){t+=parseInt(s.goals),i+=parseInt(s.assists),e+=parseInt(s.minutes),"Argentina"==s.team?(a++,s.goals>0&&(r+=parseInt(s.goals))):(n++,s.goals>0&&(o+=parseInt(s.goals))),s.details.length&&(MessiViz.GOALS_SELECTED=_.concat(MessiViz.GOALS_SELECTED,s.details.map(function(t){return t.match_id=s.id,t.team=s.team,t})))}),MessiViz.updateGoals(),MessiViz.totals.$goals.countTo({from:parseInt(MessiViz.totals.$goals.html()),to:t,speed:1e3}),MessiViz.totals.$assists.countTo({from:parseInt(MessiViz.totals.$assists.html()),to:i,speed:1e3}),MessiViz.totals.$minutes.countTo({from:parseInt(MessiViz.totals.$minutes.html()),to:e,speed:1e3}),MessiViz.totals.$matches.countTo({from:parseInt(MessiViz.totals.$matches.html()),to:l,speed:1e3}),MessiViz.totals.$goalsArg.countTo({from:parseInt(MessiViz.totals.$goalsArg.html()),to:r,speed:1e3}),MessiViz.totals.$goalsBar.countTo({from:parseInt(MessiViz.totals.$goalsBar.html()),to:o,speed:1e3})},MessiViz.updateGoals=function(){var s=e.nest().key(function(s){return s.how}).map(MessiViz.GOALS_SELECTED);e.nest().key(function(s){var t=parseInt(s.minute);return t}).map(MessiViz.GOALS_SELECTED);MessiViz.totals.$goalsLeft.countTo({from:parseInt(MessiViz.totals.$goalsLeft.html()),to:s["Left foot"]?s["Left foot"].length:0,speed:1e3}),MessiViz.totals.$goalsRight.countTo({from:parseInt(MessiViz.totals.$goalsRight.html()),to:s["Right foot"]?s["Right foot"].length:0,speed:1e3}),MessiViz.totals.$goalsHead.countTo({from:parseInt(MessiViz.totals.$goalsHead.html()),to:s.Head?s.Head.length:0,speed:1e3}),MessiViz.totals.$goalsChest.countTo({from:parseInt(MessiViz.totals.$goalsChest.html()),to:s.Chest?s.Chest.length:0,speed:1e3}),MessiViz.totals.$goalsHand.countTo({from:parseInt(MessiViz.totals.$goalsHand.html()),to:s.Hand?s.Hand.length:0,speed:1e3}),MessiViz.groups.forceLayout&&MessiViz.renderForceLayout()},MessiViz.next=function(){MessiViz.unhover(null,MessiViz.SELECTED),MessiViz.SELECTED<MessiViz.MATCHES.length-1?MessiViz.SELECTED++:MessiViz.SELECTED=0,MessiViz.hover(e.select("rect.match"+MessiViz.SELECTED).datum(),MessiViz.SELECTED)},MessiViz.prev=function(){MessiViz.unhover(null,MessiViz.SELECTED),MessiViz.SELECTED>0?MessiViz.SELECTED--:MessiViz.SELECTED=MessiViz.MATCHES.length-1,MessiViz.hover(e.select("rect.match"+MessiViz.SELECTED).datum(),MessiViz.SELECTED)},MessiViz.filter=function(s,t){var i=MessiViz.MATCHES.filter(function(i){return i[s]==t});MessiViz.renderD3Chart(i)},MessiViz.clear=function(){MessiViz.renderD3Chart(MessiViz.MATCHES)}}(window,document,jQuery,d3);