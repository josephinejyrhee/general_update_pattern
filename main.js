//console.log('hello')

// setting up the chart area
var margin = { top: 20, right: 30, bottom: 30, left: 120 };
var width = 800 - margin.left - margin.right;
var height = 600 - margin.top - margin.bottom;

var maxYield = d3.max(data, function(d){ return d.yield;})

// get unique list of years in the dataset
// similar to getting a list of years in sql
// data. doesn't mutate the original array. makes a new copy
// acc = accumulator, cur = current value of the dataset
// second parameter is an empty array which reduce is going to transform (you can put whatever datatype you want it to change)
// years is sorted because data was sorted.
var years = data.reduce(function(acc, cur) {
	if (acc.indexOf(cur.year) === -1){
		acc.push(cur.year);
	}
	return acc;
}, []);

// doing same thing as function above, except sorting by gen
var genTypes = data.reduce(function(acc, cur){
	if (acc.indexOf(cur.gen) === -1){
		acc.push(cur.gen);
		// console.log(acc);
	}
	return acc;
}, []);

var nested = d3.nest()
	.key(function(d){ return d.site; }) // hidden functions need to return
	.key(function(d){ return d.gen; })
	.entries(data);

var map = d3.map(nested, function(d){ return d.key;});




// set up scales
var xScale = d3.scalePoint().padding(0.3);
var yScale = d3.scalePoint().padding(0.1);
var radius = d3.scaleSqrt();
var color = d3.scaleOrdinal();

// makes one tick for each year on xAxis
xScale.range([0, width]).domain(years);

// yScale changes based on data, unlike the xAxis which stays constant
yScale.range([0, height]).round(true);

// d3.schemeCatagory20 is a category of 20 pre-selcted colors
color.range(d3.schemeCategory20).domain(genTypes);

// set the range of the radius (max 15)
radius.range([0, 15]).domain([0, maxYield]);


// set up axis functions
var xAxis = d3.axisBottom()
	.tickFormat(function(d) { return d; })
	.scale(xScale);
var yAxis = d3.axisLeft().scale(yScale);


// create dom elements
// creating site name
var h3 = d3.select('body').append('h3').text('asdf')

var svg = d3.select('body').append('svg')
	.attr('width', width + margin.left + margin.right)
	.attr('height', height + margin.top + margin.bottom);

// main group element
var g = svg.append('g')
	.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

g.append('g')
	.attr('class', 'y axis')
	.call(yAxis);

g.append('g')
	.attr('class', 'x axis')
	.attr('transform', 'translate(0, ' + height + ')')
	.call(xAxis);


// creates and updates chart
function updateChart(site){
	var t = g.transition().duration(750); // in msec

	// array prototype .map not d3.map
	// setting yScale to main
	yScale.domain(site.values.map(function (d){ 
		return d.key; 	// d.key represents the barley varieties
	})
	.sort());
	yAxis.scale(yScale); 	// updates yAxis with new yScale
	// using our transition selection, we select the actual group element of the yAxis and recreate it
	t.select('g.y.axis').call(yAxis);


	// bind our data to the g element
	g.datum(site.values);

	// create an empty selection of groups for each genetic variety (gen)
	// bind data and set the data binding key
	var gens = g.selectAll('g.site')
		.data(
			function(d) { return d; },
			function(d) { 
				//console.log(d.key);
				return d.key;} // key represents barley genetic variety
		);

				// update, exit, enter can be in any order

	// remove group elements that no longer exists in our new data
	gens.exit().remove();

	// update existing groups left over from the previous data
	gens
		.transition(t) // allows us to make things transition at same time (t)
		.attr('transform', function(d){
			return 'translate(0, ' + yScale(d.key) + ')';
		});

	// create new group elements if our new data has more elements than our old data
	gens.enter().append('g')
		.attr('class', 'site')
		.transition(t)
		.attr('transform', function(d){
			return 'translate(0, ' + yScale(d.key) + ')';
		});

	// reselects our gen site groups
	gens = g.selectAll('g.site');


	// create circles
	var circles = gens.selectAll('circle')
		.data(
			function(d) { return d.values; },
			function(d) { return d.years; }
		);


	// go through the general update pattern again
	// exit remove circles
	circles.exit()
		.transition(t) // after we use the transition, everything after it is going to be animated (in our case, attr and style)
		.attr('r', 0)
		.style('fill', 'rgba(255, 255, 255, 0)') // rgba is same as rgb. the last is the opacity
		.remove();

	// update existing circles
	circles
		.attr('cy', 0) // y is 0 because each circle is in an svg group that's already positioned
		.attr('cx', function(d) { return xScale(d.year); })
		.transition(t)
		.attr('r', function(d) { return radius(d.yield); })
		.attr('fill', function(d) { return color(d.gen); });

	// create new circles
	circles
		.enter().append('circle')
		.attr('cy', 0)
		.attr('cx', function(d) { return xScale(d.year); })
		.transition(t)
		.attr('r', function(d) { return radius(d.yield); })
		.attr('fill', function(d) { return color(d.gen); });


	h3.text(site.key);
}


// first chart render

updateChart(map.get('Morris'));


// cycle through every site name
// takes two parameters (the call back and how long we want the delay)
function cycle(){
	nested.forEach(function(site, i) {
		d3.timeout(function(elapsed){
			updateChart(map.get(site.key));
			console.log(elapsed);

			// recursion allows the loop to go infinitely
			// if (elapsed > 3000 * nested.length){
			//	cycle();
			//}

		}, 10000 * (i + 1));
	});
}

cycle();