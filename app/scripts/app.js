define([], function() {
  console.log('Hello from Pearson Dav Team!');

  var po = org.polymaps;


  var container = d3.select("#map").append("svg:svg").node();

  console.log(container);

  var center = {lon: -98.5795, lat: 39.828175}


  // Create the map object, add it to #map
  var map = po.map()
      .container(container)
      .zoom(4.5)
      .center(center)
      .add(po.interact());

  // Add the CloudMade image tiles as a base layer
  map.add(po.image()
      .url(po.url("http://{S}tile.cloudmade.com"
      + "/cab4b4cb386f4890b042a94ef2b87332" // http://cloudmade.com/register
      //+ "/51065/256/{Z}/{X}/{Y}.png")
      //
      + "/2400/256/{Z}/{X}/{Y}.png")
      .hosts(["a.", "b.", "c.", ""])));

  // Add the compass control on top.
  map.add(po.compass()
      .position("bottom-left")
      .pan("small"));


  // Load the station data. When the data comes back, display it.
d3.json("stations.json", function(data) {

  var colorScale = d3.scale.linear()
    .range(["#A5EDDA", "#FE326B"])


  // Insert our layer beneath the compass.
  var layer = d3.select("#map svg").insert("svg:g", ".compass");

  // Add an svg:g for each station.
  var marker = layer.selectAll("g")
      .data(d3.entries(data))
    .enter().append("svg:g")
      .attr("transform", transform);

  // Add a circle.
  marker.append("svg:circle")
      .style("stroke", "#333")
      .style("fill", function(d) {
        return colorScale(0)
      })
      .attr("r", 4.5);

  // Add a label.
  marker.append("svg:text")
      .attr("x", 7)
      .attr("dy", ".31em")
      .text(function(d) { return d.key; });

  // Whenever the map moves, update the marker positions.
  map.on("move", function() {
    layer.selectAll("g").attr("transform", transform);
  });
  
  // do the same when we resize the map
  map.on("resize", function() {
    layer.selectAll("g").attr("transform", transform);
  });


  map.on

  function transform(d) {
    d = map.locationPoint({lon: d.value[0], lat: d.value[1]});
    return "translate(" + d.x + "," + d.y + ")";
  }
});


  return 'hey!'


});