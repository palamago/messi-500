$.i18n.debug = true;
$.extend($.i18n.parser.emitter, {
	// Handle LINK keywords
	link: function(nodes) {
		return (
			'<a target="_blank" href="' + nodes[1] + '">' + nodes[0] + "</a>"
		);
	}
});
var MessiViz;
(function(global, document, $, d3) {
	"use strict";

	MessiViz = global.MessiViz = global.MessiViz || {};

	MessiViz.MATCHES;

	MessiViz.GOALS;

	MessiViz.team = "ARG";

	MessiViz.SELECTED = null;

	MessiViz.selectedSlide = "item-home";

	MessiViz.$loader = $("#loader-container");

	MessiViz.isBreakpoint = function(alias) {
		return $(".device-" + alias).is(":visible");
	};

	MessiViz.setLang = function(lang) {
		var i18n = $.i18n();

		i18n.locale = lang;
		i18n
			.load("i18n/" + i18n.locale + ".json", i18n.locale)
			.done(function() {
				$("body").i18n();
				$(".i18n-html").each(function() {
					var container = $(this);
					container.html($.i18n(container.data("i18n-html")));
				});
				MessiViz.init();
			});
	};

	MessiViz.competitions = [
		"PRM",
		"CUP",
		"EUR",
		"FRN",
		"WCQ",
		"WCP",
		"SUP",
		"IUP",
		"CPA",
		"WCT"
	];

	MessiViz.competitionName = {
		PRM: "La Liga española",
		CUP: "Copa del Rey de España",
		EUR: "Champions League",
		FRN: "Amistoso internacional",
		WCQ: "Eliminatorias para la copa del mundo",
		WCP: "Copa del mundo",
		SUP: "Supercopa de España",
		IUP: "Supercopa de Europa UEFA",
		CPA: "Copa América",
		WCT: "Mundial de clubes"
	};

	MessiViz.hows = ["Left foot", "Right foot", "Head", "Hand", "Chest"];

	MessiViz.teams = ["FC Barcelona", "Argentina"];

	MessiViz.color = d3.scale
		.ordinal()
		.domain(MessiViz.competitions)
		.range(d3.scale.category10().range());

	MessiViz.colorHow = d3.scale
		.ordinal()
		.domain(MessiViz.hows)
		.range(d3.scale.category10().range());

	MessiViz.colorTeam = d3.scale
		.ordinal()
		.domain(MessiViz.teams)
		.range(d3.scale.category10().range());

	MessiViz.colorMinutes = d3.scale
		.threshold()
		.domain([0, 1, 3, 5, 7, 9, 11, 15, 40])
		.range([
			"#ffffff",
			"#ffef9b",
			"#ffdb6c",
			"#ffc44b",
			"#ffac31",
			"#ff911b",
			"#ff7408",
			"#ff5000",
			"#ff0000"
		]);

	MessiViz.svg;

	MessiViz.groups = {};
	MessiViz.totals = {
		$goals: $(".totals-goals"),
		$assists: $("#totals-assists"),
		$minutes: $("#totals-minutes"),
		$goalsPerMatch: $("#goals-per-match"),
		$assistsPerMatch: $("#assists-per-match"),
		$matches: $("#totals-matches"),
		$goalsLeft: $("#totals-goals-left"),
		$goalsRight: $("#totals-goals-right"),
		$goalsHead: $("#totals-goals-head"),
		$goalsHand: $("#totals-goals-hand"),
		$goalsChest: $("#totals-goals-chest"),
		$goalsArg: $("#totals-goals-argentina"),
		$goalsBar: $("#totals-goals-barcelona"),
		$activeFilter: $("#active-filter"),
		$iconFilter: $("#icon-filter"),
		$messiContainer: $("#messi-container"),
		$svgMinutes: $("#svg-minutes-container")
	};

	MessiViz.barGap = {
		x: 0,
		y: 0
	};

	MessiViz.init = function() {
		d3.csv("./data/messi-500-matches.csv", function(data) {
			MessiViz.MATCHES = data.sort(function(a,b){
					return a.date>b.date ? 1:-1;
				});
			d3.csv("./data/messi-500-goals.csv", function(data) {
				MessiViz.GOALS = data.sort(function(a,b){
					return (a.date>b.date) ? 1:-1;
				});
				MessiViz.dataLoaded();
			});
		});

		d3.xml("./images/messi-01-01-01.svg", "image/svg+xml", function(
			error,
			xml
		) {
			if (error) throw error;
			MessiViz.totals.$messiContainer.html(xml.documentElement);
			$("#messi-container svg path").each(function(i, e) {
				var path = $(e);
				if (path.attr("fill") == "#49869D") {
					path.addClass("color1");
				} else if (path.attr("fill") == "#FFFFFF") {
					path.addClass("color2");
				}
			});
			setInterval(function() {
				if (MessiViz.team == "ARG") {
					MessiViz.team = "BAR";
					d3
						.selectAll("#messi-container svg path.color1")
						.transition()
						.duration(2000)
						.attr("fill", "#00529F");
					d3
						.selectAll("#messi-container svg path.color2")
						.transition()
						.duration(2000)
						.attr("fill", "#A2214B");
					d3
						.selectAll("#messi-container svg path.color3")
						.transition()
						.duration(2000)
						.attr("fill", "#F2C114");
				} else {
					MessiViz.team = "ARG";
					d3
						.selectAll("#messi-container svg path.color1")
						.transition()
						.duration(2000)
						.attr("fill", "#75AADB");
					d3
						.selectAll("#messi-container svg path.color2")
						.transition()
						.duration(2000)
						.attr("fill", "#FFFFFF");
					d3
						.selectAll("#messi-container svg path.color3")
						.transition()
						.duration(2000)
						.attr("fill", "#232323");
				}
			}, 5000);
		});
	};

	MessiViz.dataLoaded = function() {
		var goals_nested = d3
			.nest()
			.key(function(d) {
				return d.date;
			})
			.map(MessiViz.GOALS);

		_.forEach(MessiViz.MATCHES, function(match) {
			if (goals_nested[match.date]) {
				match.details = goals_nested[match.date];
			} else {
				match.details = [];
			}
		});

		MessiViz.renderD3Chart(MessiViz.MATCHES, 2000);
		MessiViz.initEvents();
		MessiViz.hideTooltip();
	};

	MessiViz.renderD3Chart = function(DATA, delay) {
		//MessiViz.MATCHES = MessiViz.MATCHES.slice(0,100);
		MessiViz.SELECTED_MATCHES = DATA.map(function(d, i) {
			d.index = i;
		});

		//SVG
		if (!MessiViz.svg) {
			(MessiViz.margin = {
				top: 0,
				right: 0,
				bottom: 0,
				left: 0
			}), (MessiViz.width =
				$(window).width() -
				MessiViz.margin.left -
				MessiViz.margin.right), (MessiViz.height =
				$(window).height() -
				MessiViz.margin.top -
				MessiViz.margin.bottom);
			MessiViz.chartSize = 100;

			var h = MessiViz.height - $(".masthead").height();
			if (MessiViz.isBreakpoint("md") || MessiViz.isBreakpoint("lg")) {
				h -= MessiViz.chartSize;
			}
			$(".carousel-inner,.item").height(h);

			MessiViz.svg = d3
				.select("#svg-container")
				.append("svg")
				.classed("main-svg", true)
				.attr(
					"width",
					MessiViz.width +
						MessiViz.margin.left +
						MessiViz.margin.right
				)
				.attr(
					"height",
					MessiViz.height +
						MessiViz.margin.top +
						MessiViz.margin.bottom
				)
				.append("g")
				.attr(
					"transform",
					"translate(" +
						MessiViz.margin.left +
						"," +
						MessiViz.margin.top +
						")"
				);

			MessiViz.tooltip = d3
				.select("body")
				.append("div")
				.classed("info-tooltip", true)
				.style("top", 0)
				.style("left", 0)
				.style("width", MessiViz.width / 4 + "px")
				.style("height", MessiViz.height / 4 + "px")
				.style("display", "block");

			MessiViz.$loader.removeClass("loading");
		}

		if (!MessiViz.isBreakpoint("sm") && !MessiViz.isBreakpoint("xs")) {
			MessiViz.tooltipx = d3.scale
				.linear()
				.domain([0, MessiViz.SELECTED_MATCHES.length])
				.range([
					MessiViz.chartSize,
					MessiViz.width - MessiViz.width / 4 - MessiViz.chartSize
				]);

			MessiViz.tooltipy = d3.scale
				.linear()
				.domain([0, MessiViz.SELECTED_MATCHES.length])
				.range([
					0,
					MessiViz.height - MessiViz.height / 4 - MessiViz.chartSize
				]);

			delay = delay ? delay : 0;

			MessiViz.renderGoals(DATA, delay);
			MessiViz.renderAssists(DATA, delay);
			MessiViz.renderMinutes(DATA, delay);
		}

		MessiViz.updateTotals(DATA);

		if (!MessiViz.lineh) {
			//selection lines
			MessiViz.lineh = MessiViz.svg
				.append("line")
				.classed("lineh", true)
				.attr("x1", 0)
				.attr("y1", 0)
				.attr("x2", MessiViz.width)
				.attr("y2", 0);

			MessiViz.linev = MessiViz.svg
				.append("line")
				.classed("linev", true)
				.attr("x1", 0)
				.attr("y1", 0)
				.attr("x2", 0)
				.attr("y2", MessiViz.height);
		}
	};

	MessiViz.renderGoals = function(DATA, delay) {
		if (!MessiViz.groups.goals) {
			MessiViz.groups.goals = MessiViz.svg
				.append("g")
				.classed("goals", true);
			MessiViz.maxGoals = d3.max(DATA, function(d) {
				return d.goals;
			});

			MessiViz.totals.goals = MessiViz.groups.goals
				.append("text")
				.text(function(d) {
					return "";
				})
				.classed("totals-number", true)
				.attr("id", "totals-number-goals")
				.attr("y", function(d, i) {
					return MessiViz.height / 2;
				})
				.attr("x", function(d, i) {
					return (MessiViz.width - MessiViz.chartSize * 2) / 4;
				})
				.attr("text-anchor", "middle");

			MessiViz.groups.goals
				.append("text")
				.text(function(d) {
					return $.i18n("vis-goals");
				})
				.attr("data-i18n", "vis-goals")
				.classed("totals-label", true)
				.attr("y", function(d, i) {
					return 0;
				})
				.attr("x", function(d, i) {
					return MessiViz.height / 2 - MessiViz.chartSize / 2;
				})
				.attr("text-anchor", "middle")
				.attr("transform", "rotate(90)");
		}

		var y = d3.scale
			.ordinal()
			.domain([0, DATA.length])
			.rangeBands([0, MessiViz.height - MessiViz.chartSize]);

		var x = d3.scale
			.linear()
			.domain(d3.range(0, 6, 1))
			.range([0, MessiViz.chartSize]);

		y.domain(
			DATA.map(function(d, i) {
				return i;
			})
		);
		x.domain([0, MessiViz.maxGoals]);

		MessiViz.barGap.y = y.rangeBand();

		var bars = MessiViz.groups.goals.selectAll(".bar.bar-goal").data(DATA);

		bars.exit().remove();

		bars
			.enter()
			.append("rect")
			.attr("x", function(d, i) {
				return 0;
			})
			.attr("width", function(d) {
				return 0;
			});

		bars
			.attr("class", function(d, i) {
				return "match" + d.id + " " + d.competition;
			})
			.classed("bar", true)
			.classed("bar-unit", true)
			.classed("bar-goal", true)
			.transition()
			.delay(function(d, i) {
				return i * 5 + delay;
			})
			.attr("fill", "#ddd")
			.attr("y", function(d, i) {
				return y(i);
			})
			.attr("height", y.rangeBand())
			.attr("width", function(d) {
				return x(d.goals) == 0 ? 2 : x(d.goals);
			});

		var bars = MessiViz.groups.goals
			.selectAll(".bar.bar-goal-fill")
			.data(DATA);

		bars.exit().remove();

		bars
			.enter()
			.append("rect")
			.classed("bar", true)
			.classed("bar-goal-fill", true)
			.attr("fill", "transparent")
			.attr("x", function(d, i) {
				return 0;
			})
			.attr("width", function(d) {
				return x(MessiViz.maxGoals);
			});

		bars
			.attr("y", function(d, i) {
				return y(i);
			})
			.attr("height", y.rangeBand())
			.on("mouseover", function(d) {
				MessiViz.hover(d);
			})
			.on("mouseout", function(d) {
				MessiViz.unhover(d);
			});
	};

	MessiViz.renderAssists = function(DATA, delay) {
		if (!MessiViz.groups.assists) {
			MessiViz.groups.assists = MessiViz.svg
				.append("g")
				.classed("assists", true);
			MessiViz.maxAssists = d3.max(DATA, function(d) {
				return d.assists;
			});

			MessiViz.totals.assists = MessiViz.groups.assists
				.append("text")
				.text(function(d) {
					return "";
				})
				.classed("totals-number", true)
				.attr("id", "totals-number-assists")
				.attr("y", function(d, i) {
					return MessiViz.height / 2;
				})
				.attr("x", function(d, i) {
					return (
						MessiViz.width -
						MessiViz.chartSize -
						(MessiViz.width - MessiViz.chartSize * 2) / 4
					);
				})
				.attr("text-anchor", "middle");

			MessiViz.groups.assists
				.append("text")
				.text(function(d) {
					return $.i18n("vis-assists");
				})
				.attr("data-i18n", "vis-assists")
				.classed("totals-label-assists", true)
				.attr("y", function(d, i) {
					return MessiViz.width;
				})
				.attr("x", function(d, i) {
					return -MessiViz.height / 2 + MessiViz.chartSize / 2;
				})
				.attr("text-anchor", "middle")
				.attr("transform", "rotate(270)");
		}

		var y = d3.scale
			.ordinal()
			.domain([0, DATA.length])
			.rangeBands([0, MessiViz.height - MessiViz.chartSize]);

		var x = d3.scale
			.linear()
			.domain(d3.range(0, MessiViz.maxAssists, 1))
			.range([0, MessiViz.chartSize]);

		y.domain(
			DATA.map(function(d, i) {
				return i;
			})
		);
		x.domain([0, MessiViz.maxAssists]);

		var bars = MessiViz.groups.assists
			.selectAll(".bar.bar-assist")
			.data(DATA);

		bars.exit().remove();

		bars
			.enter()
			.append("rect")
			.attr("x", function(d, i) {
				return MessiViz.width;
			})
			.attr("width", function(d) {
				return 0;
			});

		bars
			.attr("class", function(d, i) {
				return "match" + d.id + " " + d.competition;
			})
			.classed("bar", true)
			.classed("bar-unit", true)
			.classed("bar-assist", true)
			.transition()
			.delay(function(d, i) {
				return i * 5 + delay;
			})
			.attr("fill", "#ddd")
			.attr("y", function(d, i) {
				return y(i);
			})
			.attr("height", y.rangeBand())
			.attr("width", function(d) {
				return x(d.assists) == 0 ? 2 : x(d.assists);
			})
			.attr("x", function(d, i) {
				var xval = x(d.assists) == 0 ? 2 : x(d.assists);
				return MessiViz.width - xval;
			});

		var bars = MessiViz.groups.assists
			.selectAll(".bar.bar-assist-fill")
			.data(DATA);

		bars.exit().remove();

		bars
			.enter()
			.append("rect")
			.classed("bar", true)
			.classed("bar-assist-fill", true)
			.attr("fill", "transparent")
			.attr("x", function(d, i) {
				return MessiViz.width - x(MessiViz.maxAssists);
			})
			.attr("width", function(d) {
				return x(MessiViz.maxAssists);
			});

		bars
			.attr("y", function(d, i) {
				return y(i);
			})
			.attr("height", y.rangeBand())
			.on("mouseover", function(d) {
				MessiViz.hover(d);
			})
			.on("mouseout", function(d) {
				MessiViz.unhover(d);
			});
	};

	MessiViz.renderMinutes = function(DATA, delay) {
		if (!MessiViz.groups.minutes) {
			MessiViz.groups.minutes = MessiViz.svg
				.append("g")
				.classed("minutes", true);
			MessiViz.maxMinutes = d3.max(DATA, function(d) {
				return parseInt(d.minutes);
			});

			MessiViz.totals.minutes = MessiViz.groups.minutes
				.append("text")
				.text(function(d) {
					return "";
				})
				.classed("totals-number", true)
				.attr("id", "totals-number-minutes")
				.attr("y", function(d, i) {
					return MessiViz.height / 2;
				})
				.attr("x", function(d, i) {
					return MessiViz.width / 2;
				})
				.attr("text-anchor", "middle");

			MessiViz.totals.matches = MessiViz.groups.minutes
				.append("text")
				.text(function(d) {
					return "";
				})
				.classed("totals-number", true)
				.attr("id", "totals-number-matches")
				.attr("y", function(d, i) {
					return MessiViz.height / 2 + 200;
				})
				.attr("x", function(d, i) {
					return MessiViz.width / 2;
				})
				.attr("text-anchor", "middle");

			MessiViz.groups.minutes
				.append("text")
				.text(function(d) {
					return $.i18n("vis-minutes");
				})
				.attr("data-i18n", "vis-minutes")
				.classed("totals-label", true)
				.attr("y", function(d, i) {
					return MessiViz.height;
				})
				.attr("x", function(d, i) {
					return MessiViz.width / 2;
				})
				.attr("text-anchor", "middle");
		}

		var x = d3.scale
			.ordinal()
			.domain([0, DATA.length])
			.rangeBands([
				MessiViz.chartSize,
				MessiViz.width - MessiViz.chartSize
			]);

		var y = d3.scale
			.linear()
			.domain(d3.range(0, MessiViz.maxMinutes, 1))
			.range([0, MessiViz.chartSize]);

		x.domain(
			DATA.map(function(d, i) {
				return i;
			})
		);
		y.domain([0, MessiViz.maxMinutes]);

		MessiViz.barGap.x = x.rangeBand();

		var bars = MessiViz.groups.minutes
			.selectAll(".bar.bar-minute")
			.data(DATA);

		bars.exit().remove();

		bars
			.enter()
			.append("rect")
			.attr("y", function(d, i) {
				return MessiViz.height;
			})
			.attr("height", function(d) {
				return 0;
			});

		bars
			.attr("class", function(d, i) {
				return "match" + d.id + " " + d.competition;
			})
			.classed("bar", true)
			.classed("bar-unit", true)
			.classed("bar-minute", true)
			.transition()
			.delay(function(d, i) {
				return i * 5 + delay;
			})
			.attr("fill", "#ddd")
			.attr("x", function(d, i) {
				return x(i);
			})
			.attr("width", x.rangeBand())
			.attr("y", function(d, i) {
				return MessiViz.height - y(d.minutes);
			})
			.attr("height", function(d) {
				return y(d.minutes);
			});

		var bars = MessiViz.groups.minutes
			.selectAll(".bar.bar-minute-fill")
			.data(DATA);

		bars.exit().remove();

		bars
			.enter()
			.append("rect")
			.classed("bar", true)
			.classed("bar-minute-fill", true)
			.attr("fill", "transparent")
			.attr("y", function(d, i) {
				return MessiViz.height - y(MessiViz.maxMinutes);
			})
			.attr("height", function(d) {
				return y(MessiViz.maxMinutes);
			});

		bars
			.attr("width", x.rangeBand())
			.attr("x", function(d, i) {
				return x(i);
			})
			.on("mouseover", function(d) {
				MessiViz.hover(d);
			})
			.on("mouseout", function(d) {
				MessiViz.unhover(d);
			});
	};

	MessiViz.renderMinutesMatrix = function() {
		var goalsMinutes = d3
			.nest()
			.key(function(d) {
				var m = parseInt(d.minute);
				if (d.minute > 90) return 90;
				return m;
			})
			.entries(MessiViz.GOALS_SELECTED);

		d3.range(1, 91).forEach(function(n) {
			if (!_.find(goalsMinutes, { key: "" + n })) {
				goalsMinutes.push({ key: n, values: [] });
			}
		});

		goalsMinutes.sort(function(a, b) {
			return parseInt(a.key) > parseInt(b.key);
		});

		var h = MessiViz.totals.$svgMinutes.parent().innerHeight();
		var w = MessiViz.totals.$svgMinutes.parent().innerWidth();

		if (MessiViz.isBreakpoint("sm") || MessiViz.isBreakpoint("xs")) {
			h -= $("#matrix-title-container").height();
		}

		if (!MessiViz.groups.matrix) {
			(MessiViz.matrixMargin = {
				top: 10,
				right: 0,
				bottom: 10,
				left: 0
			}), (MessiViz.matrixSvg = d3
				.select("#svg-minutes-container")
				.append("svg")
				.classed("matrix-svg", true)
				.attr("width", w)
				.attr("height", h));
			MessiViz.groups.matrix = MessiViz.matrixSvg
				.append("g")
				.classed("matrix-group", true)
				.attr(
					"transform",
					"translate(" +
						MessiViz.matrixMargin.left +
						"," +
						MessiViz.matrixMargin.top +
						")"
				);
		}

		var x = d3.scale.ordinal().domain(d3.range(1, 11)).rangeBands([0, w]);

		var y = d3.scale
			.ordinal()
			.domain(d3.range(1, 10))
			.rangeBands([
				0,
				h - MessiViz.matrixMargin.top - MessiViz.matrixMargin.bottom
			]);

		var matrixBack = MessiViz.groups.matrix
			.selectAll(".matrix-back")
			.data(goalsMinutes);

		matrixBack
			.enter()
			.append("rect")
			.attr("x", function(d, i) {
				return x(d.key % 10 == 0 ? 10 : d.key % 10);
			})
			.attr("y", function(d, i) {
				return y(Math.ceil(d.key / 10));
			})
			.attr("height", y.rangeBand())
			.attr("width", x.rangeBand());

		matrixBack
			.attr("class", function(d, i) {
				return "minute" + d.key;
			})
			.classed("matrix-back", true)
			.transition()
			.attr("fill", function(d) {
				return MessiViz.colorMinutes(d.values.length);
			});

		var matrixItems = MessiViz.groups.matrix
			.selectAll(".matrix-goals")
			.data(goalsMinutes);

		matrixItems
			.enter()
			.append("text")
			.attr("text-anchor", "middle")
			.attr("alignment-baseline", "middle")
			.attr("x", function(d, i) {
				return x(d.key % 10 == 0 ? 10 : d.key % 10) + x.rangeBand() / 2;
			})
			.attr("y", function(d, i) {
				return (
					y(Math.ceil(d.key / 10)) +
					y.rangeBand() / 2 +
					y.rangeBand() / 4
				);
			});

		matrixItems
			.attr("class", function(d, i) {
				return "minute" + d.key;
			})
			.text(function(d) {
				return d.values.length;
			})
			.classed("matrix-goals", true)
			.attr("fill", "#000");

		var matrixItems = MessiViz.groups.matrix
			.selectAll(".matrix-minute")
			.data(goalsMinutes);

		matrixItems
			.enter()
			.append("text")
			.attr("text-anchor", "middle")
			.attr("alignment-baseline", "baseline")
			.attr("x", function(d, i) {
				return x(d.key % 10 == 0 ? 10 : d.key % 10) + x.rangeBand() / 2;
			})
			.attr("y", function(d, i) {
				return (
					y(Math.ceil(d.key / 10)) +
					y.rangeBand() / 2 -
					y.rangeBand() / 4
				);
			});

		matrixItems
			.attr("class", function(d, i) {
				return "minute" + d.key;
			})
			.text(function(d) {
				return d.key == 90 || d.key == 45 ? d.key + "'+" : d.key + "'";
			})
			.classed("matrix-minute", true)
			.attr("fill", "#333");
	};

	MessiViz.hover = function(data) {
		MessiViz.SELECTED = data.id;
		d3.selectAll("rect.match" + data.id).classed("selectedMatch", true);
		d3.selectAll("circle.match" + data.id).classed("selectedGoal", true);
		var x = d3.select("rect.bar-minute.match" + data.id).attr("x");
		var y = d3.select("rect.bar-goal.match" + data.id).attr("y");
		MessiViz.linev
			.transition()
			.style("opacity", 1)
			.attr("x1", Math.round(x) + Math.round(MessiViz.barGap.x / 2))
			.attr("y1", Math.round(y) + Math.round(MessiViz.barGap.y / 2))
			.attr("x2", Math.round(x) + Math.round(MessiViz.barGap.x / 2));
		MessiViz.lineh
			.transition()
			.style("opacity", 1)
			.attr("y1", Math.round(y) + Math.round(MessiViz.barGap.y / 2))
			.attr("y2", Math.round(y) + Math.round(MessiViz.barGap.y / 2));
		MessiViz.tooltip
			.html(function() {
				var winner =
					data.home_goals > data.away_goals ? "home" : "away";
				var looser =
					data.home_goals < data.away_goals ? "home" : "away";
				var text =
					"<p>" +
					$.i18n(
						"game-date",
						data.date,
						data.home,
						data.away,
						$.i18n(data.competition)
					);

				if (winner == looser) {
					text += $.i18n("game-tie");
				} else if (looser == "home") {
					text += $.i18n("game-away");
				} else {
					text += $.i18n("game-home");
				}
				text += $.i18n("game-result", data.home_goals, data.away_goals);

				if (data.goals == 0) {
					text += $.i18n("game-no-goals", MessiViz.color("GOAL"));
				} else if (data.goals == 1) {
					text += $.i18n(
						"game-one-goals",
						MessiViz.color("GOAL"),
						data.details[0].minute
					);
				} else {
					text += $.i18n(
						"game-n-goals",
						MessiViz.color("GOAL"),
						data.goals
					);
				}

				if (data.assists == 0) {
					text += $.i18n("game-no-assists", MessiViz.color("ASSIST"));
				} else if (data.assists == 1) {
					text += $.i18n(
						"game-one-assists",
						MessiViz.color("ASSIST")
					);
				} else {
					text += $.i18n(
						"game-n-assists",
						MessiViz.color("ASSIST"),
						data.assists
					);
				}

				if (data.minutes >= 90) {
					text += $.i18n("game-90", MessiViz.color("MINUTE"));
					if (data.minutes == 120) {
						text += $.i18n("game-120", MessiViz.color("MINUTE"));
					}
					text += ".";
				} else if (data.minutes < 45) {
					text += $.i18n(
						"game-less",
						MessiViz.color("MINUTE"),
						data.minutes
					);
				} else {
					text += $.i18n(
						"game-more",
						MessiViz.color("MINUTE"),
						data.minutes
					);
				}

				return text + "</p>";
			})
			.transition()
			.style("opacity", "1")
			.style("left", MessiViz.tooltipx(data.index) + "px")
			.style("top", MessiViz.tooltipy(data.index) + "px");
	};

	MessiViz.unhover = function(data, match) {
		d3.selectAll("rect.bar").classed("selectedMatch", false);
		d3.selectAll("circle.goal").classed("selectedGoal", false);
	};

	MessiViz.hideTooltip = function(data, match) {
		MessiViz.tooltip.transition().style("opacity", "0");
		MessiViz.linev
			.transition()
			.attr("x1", 0)
			.attr("x2", MessiViz.width)
			.style("opacity", 0);
		MessiViz.lineh
			.transition()
			.attr("y1", MessiViz.height)
			.attr("y2", 0)
			.style("opacity", 0);
	};

	MessiViz.initEvents = function() {
		$(document).keydown(function(e) {
			switch (e.which) {
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

				default:
					return; // exit this handler for other keys
			}
			e.preventDefault(); // prevent the default action (scroll / move caret)
		});

		$(".btn-filter").on("click", function() {
			var $filter = $(this);
			MessiViz.totals.$activeFilter.html($filter.html());
			MessiViz.totals.$iconFilter.fadeOut();
			$filter
				.parent()
				.addClass("disabled")
				.siblings()
				.removeClass("disabled");
			MessiViz.hideTooltip();
			MessiViz.filter($filter.data("field"), $filter.data("filter"));
		});

		$("#clear-filter").on("click", function() {
			MessiViz.totals.$activeFilter.html("total");
			MessiViz.totals.$iconFilter.fadeIn();
			$(".btn-filter").parent().removeClass("disabled");
			MessiViz.clear();
		});

		$("#filtersModal").on("show.bs.modal", function(event) {
			MessiViz.hideTooltip();
		});

		$("#carousel-messi")
			.carousel({
				interval: false
			})
			.off("keydown.bs.carousel");

		$(".container").mouseenter(function() {
			MessiViz.hideTooltip();
			MessiViz.clearBars();
			MessiViz.updateBySlide();
		});

		$("svg.main-svg").mouseenter(function() {
			MessiViz.showBars();
			MessiViz.hideTotals();
		});

		$("#carousel-messi").on("slid.bs.carousel", function(event) {
			var id = $(event.relatedTarget).attr("id");
			MessiViz.selectedSlide = id;
			MessiViz.updateBySlide();
		});

		$("#enter").on("click", function() {
			window.scrollTo(0, 0);
			$("body").removeClass("help");
			MessiViz.$loader.fadeOut();
		});

		$(".change-lang").on("click", function() {
			MessiViz.setLang($(this).data("lang"));
			$(".change-lang").removeClass("hide");
			$(this).addClass("hide");
		});
	};

	MessiViz.hideTotals = function() {
		$("h4.main-total").css("color", "#ddd");
		if (MessiViz.groups.forceLayout) {
			MessiViz.groups.forceLayout
				.selectAll("circle.goal")
				.attr("fill", "#111");
		}
	};

	MessiViz.updateBySlide = function() {
		switch (MessiViz.selectedSlide) {
			case "item-home":
				MessiViz.hideForceLayout();
				break;
			case "item-totals":
				MessiViz.renderForceLayout();
				break;
			case "item-goals":
				MessiViz.renderForceLayout();
				MessiViz.goalsByHow();
				break;
			case "item-teams":
				MessiViz.renderForceLayout();
				MessiViz.goalsByTeam();
				break;
			case "item-minutes":
				MessiViz.hideForceLayout();
				MessiViz.renderMinutesMatrix();
				break;
		}
	};

	MessiViz.renderForceLayout = function() {
		var nodes = MessiViz.GOALS_SELECTED.map(function(d) {
			d.radius = 8;
			return d;
		});

		nodes.unshift({ radius: 0, fixed: true });

		var force = d3.layout
			.force()
			.gravity(0.08)
			.charge(function(d, i) {
				return d.fixed ? 0 : -10;
			})
			.nodes(nodes)
			.size([MessiViz.width, MessiViz.height]);

		if (!MessiViz.groups.forceLayout) {
			MessiViz.groups.forceLayout = MessiViz.svg
				.append("g")
				.classed("force-layout", true);
		}
		force.start();

		var circles = MessiViz.groups.forceLayout
			.selectAll("circle.goal")
			.data(nodes.slice(1));

		circles.exit().remove();

		circles
			.enter()
			.append("svg:circle")
			.attr("r", function(d) {
				return d.radius;
			})
			.attr("cx", 0)
			.attr("cy", 0);

		circles
			.attr("fill", "#111")
			.attr("class", function(d) {
				return "match" + d.match_id;
			})
			.classed("goal", true);

		force.on("tick", function(e) {
			nodes[0].x = MessiViz.width / 2;
			nodes[0].y = MessiViz.height / 2;
			var q = d3.geom.quadtree(nodes),
				i = 0,
				n = nodes.length;

			while (++i < n) {
				q.visit(collide(nodes[i]));
			}

			MessiViz.groups.forceLayout
				.selectAll("circle.goal")
				.attr("cx", function(d) {
					return d.x;
				})
				.attr("cy", function(d) {
					return d.y;
				});
		});

		force.resume();

		function collide(node) {
			var r = node.radius + 20,
				nx1 = node.x - r,
				nx2 = node.x + r,
				ny1 = node.y - r,
				ny2 = node.y + r;
			return function(quad, x1, y1, x2, y2) {
				if (quad.point && quad.point !== node) {
					var x = node.x - quad.point.x,
						y = node.y - quad.point.y,
						l = Math.sqrt(x * x + y * y),
						r = node.radius + quad.point.radius;
					if (l < r) {
						l = (l - r) / l * 0.5;
						node.x -= x *= l;
						node.y -= y *= l;
						quad.point.x += x;
						quad.point.y += y;
					}
				}
				return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
			};
		}
	};

	MessiViz.goalsByHow = function() {
		$("#item-goals h4").each(function(d) {
			var h = $(this);
			h.css("color", MessiViz.colorHow(h.data("how")));
		});

		MessiViz.groups.forceLayout
			.selectAll("circle.goal")
			.attr("fill", function(d) {
				return MessiViz.colorHow(d.how);
			});
	};

	MessiViz.goalsByTeam = function() {
		$("#item-teams h4").each(function(d) {
			var h = $(this);
			h.css("color", MessiViz.colorTeam(h.data("team")));
		});

		MessiViz.groups.forceLayout
			.selectAll("circle.goal")
			.attr("fill", function(d) {
				return MessiViz.colorTeam(d.team);
			});
	};

	MessiViz.hideForceLayout = function() {
		if (MessiViz.groups.forceLayout) {
			MessiViz.groups.forceLayout
				.selectAll("circle.goal")
				.transition()
				.attr("r", 0)
				.remove();
		}
	};

	MessiViz.clearBars = function() {
		d3.selectAll("rect.bar-unit").attr("fill", "#ddd");
		d3
			.selectAll("text.totals-label,text.totals-label-assists")
			.style("opacity", 0);
	};

	MessiViz.showBars = function() {
		d3.selectAll("rect.bar-goal").attr("fill", function(d, i) {
			return MessiViz.color("GOAL");
		});
		d3.selectAll("rect.bar-assist").attr("fill", function(d, i) {
			return MessiViz.color("ASSIST");
		});
		d3.selectAll("rect.bar-minute").attr("fill", function(d, i) {
			return MessiViz.color("MINUTE");
		});
		d3
			.selectAll("text.totals-label,text.totals-label-assists")
			.style("opacity", 1);
	};

	MessiViz.updateTotals = function(DATA) {
		var goals = 0,
			assists = 0,
			minutes = 0,
			arg = 0,
			bar = 0,
			arg_goals = 0,
			bar_goals = 0,
			matches = DATA.length;

		MessiViz.GOALS_SELECTED = [];

		DATA.forEach(function(data) {
			goals += parseInt(data.goals);
			assists += parseInt(data.assists);
			minutes += parseInt(data.minutes);
			if (data.team == "Argentina") {
				arg++;
				if (data.goals > 0) {
					arg_goals += parseInt(data.goals);
				}
			} else {
				bar++;
				if (data.goals > 0) {
					bar_goals += parseInt(data.goals);
				}
			}
			if (data.details.length) {
				MessiViz.GOALS_SELECTED = _.concat(
					MessiViz.GOALS_SELECTED,
					data.details.map(function(d) {
						d.match_id = data.id;
						d.team = data.team;
						return d;
					})
				);
			}
		});

		MessiViz.updateGoals();

		MessiViz.totals.$goals.countTo({
			from: parseInt(MessiViz.totals.$goals.html()),
			to: goals,
			speed: 1000,
			formatter: function(value, options) {
				return value.toFixed(options.decimals);
			}
		});

		MessiViz.totals.$assists.countTo({
			from: parseInt(MessiViz.totals.$assists.html()),
			to: assists,
			speed: 1000,
			formatter: function(value, options) {
				return value.toFixed(options.decimals);
			}
		});

		MessiViz.totals.$goalsPerMatch.countTo({
			from: parseInt(MessiViz.totals.$goalsPerMatch.html()),
			to: goals / matches,
			speed: 1000,
			formatter: function(value, options) {
				return value.toFixed(2);
			}
		});

		MessiViz.totals.$assistsPerMatch.countTo({
			from: parseInt(MessiViz.totals.$assistsPerMatch.html()),
			to: assists / matches,
			speed: 1000,
			formatter: function(value, options) {
				return value.toFixed(2);
			}
		});

		MessiViz.totals.$minutes.countTo({
			from: parseInt(MessiViz.totals.$minutes.html()),
			to: minutes,
			speed: 1000,
			formatter: function(value, options) {
				return value.toFixed(options.decimals);
			}
		});

		MessiViz.totals.$matches.countTo({
			from: parseInt(MessiViz.totals.$matches.html()),
			to: matches,
			speed: 1000,
			formatter: function(value, options) {
				return value.toFixed(options.decimals);
			}
		});

		MessiViz.totals.$goalsArg.countTo({
			from: parseInt(MessiViz.totals.$goalsArg.html()),
			to: arg_goals,
			speed: 1000,
			formatter: function(value, options) {
				return value.toFixed(options.decimals);
			}
		});

		MessiViz.totals.$goalsBar.countTo({
			from: parseInt(MessiViz.totals.$goalsBar.html()),
			to: bar_goals,
			speed: 1000,
			formatter: function(value, options) {
				return value.toFixed(options.decimals);
			}
		});
	};

	MessiViz.updateGoals = function() {
		var goalsHow = d3
			.nest()
			.key(function(d) {
				return d.how;
			})
			.map(MessiViz.GOALS_SELECTED);

		MessiViz.totals.$goalsLeft.countTo({
			from: parseInt(MessiViz.totals.$goalsLeft.html()),
			to: goalsHow["Left foot"] ? goalsHow["Left foot"].length : 0,
			speed: 1000,
			formatter: function(value, options) {
				return value.toFixed(options.decimals);
			}
		});

		MessiViz.totals.$goalsRight.countTo({
			from: parseInt(MessiViz.totals.$goalsRight.html()),
			to: goalsHow["Right foot"] ? goalsHow["Right foot"].length : 0,
			speed: 1000,
			formatter: function(value, options) {
				return value.toFixed(options.decimals);
			}
		});

		MessiViz.totals.$goalsHead.countTo({
			from: parseInt(MessiViz.totals.$goalsHead.html()),
			to: goalsHow["Head"] ? goalsHow["Head"].length : 0,
			speed: 1000,
			formatter: function(value, options) {
				return value.toFixed(options.decimals);
			}
		});

		MessiViz.totals.$goalsChest.countTo({
			from: parseInt(MessiViz.totals.$goalsChest.html()),
			to: goalsHow["Chest"] ? goalsHow["Chest"].length : 0,
			speed: 1000,
			formatter: function(value, options) {
				return value.toFixed(options.decimals);
			}
		});

		MessiViz.totals.$goalsHand.countTo({
			from: parseInt(MessiViz.totals.$goalsHand.html()),
			to: goalsHow["Hand"] ? goalsHow["Hand"].length : 0,
			speed: 1000,
			formatter: function(value, options) {
				return value.toFixed(options.decimals);
			}
		});

		MessiViz.updateBySlide();
	};

	MessiViz.next = function() {
		MessiViz.unhover(null, MessiViz.SELECTED);
		if (MessiViz.SELECTED < MessiViz.MATCHES.length - 1) {
			MessiViz.SELECTED++;
		} else {
			MessiViz.SELECTED = 0;
		}
		MessiViz.hover(
			d3.select("rect.match" + MessiViz.SELECTED).datum(),
			MessiViz.SELECTED
		);
	};

	MessiViz.prev = function() {
		MessiViz.unhover(null, MessiViz.SELECTED);

		if (MessiViz.SELECTED > 0) {
			MessiViz.SELECTED--;
		} else {
			MessiViz.SELECTED = MessiViz.MATCHES.length - 1;
		}
		MessiViz.hover(
			d3.select("rect.match" + MessiViz.SELECTED).datum(),
			MessiViz.SELECTED
		);
	};

	MessiViz.filter = function(field, value) {
		var DATA = MessiViz.MATCHES.filter(function(d) {
			return d[field] == value;
		});
		MessiViz.renderD3Chart(DATA);
	};

	MessiViz.clear = function() {
		MessiViz.renderD3Chart(MessiViz.MATCHES);
	};
})(window, document, jQuery, d3);
