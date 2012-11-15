define([], function() {

  // namespace
  var SchoolMaps = {

    // container for our application views
    Views : {},
    // application router
    Router : Backbone.Router.extend({

      routes : {
        "" : "index"
      },

      index : function() {
        
        // configuration parameters that are used throughout the application:
        SchoolMaps.config = {
          // Define the start of the period we're interested in 
          startDate : moment("01-01-2001", "DD-MM-YYYY"),

          // Define the end of the period we're interested in 
          finalDate : moment("31-03-2012", "DD-MM-YYYY"),

          // Define a way to refer to all records within range
          wholeRange : "2001 / 2011",

          // default dates, all.
          dateRanges : ["2001 / 2011"],

          // Define which columns the data can be grouped by:
          // "Expense Type","Expense Area","Supplier"

          // Define the maximum number of groups to be included in the chart at any time

          categoryColors : [
            "#CF3D1E", "#F15623", "#F68B1F", "#FFC60B", "#DFCE21",
            "#BCD631", "#95C93D", "#48B85C", "#00833D", "#00B48D", 
            "#60C4B1", "#27C4F4", "#478DCB", "#3E67B1", "#4251A3", "#59449B", 
            "#6E3F7C", "#6A246D", "#8A4873", "#EB0080", "#EF58A0", "#C05A89"
           ]

        };

        // state management 
        SchoolMaps.state = {
          // Store the name of the currently selected month range
          currentRange : SchoolMaps.config.wholeRange,

        };

        // columns
        SchoolMaps.schoolColumns = [

          { 
            name: "lat", 
            type: "number", 
            // Define a helper for pre-processing numeric values - 
            // ensures empty cells are set to 0 and the rest are 
            // stripped of commas and turned to floats
            before: function(v){
              return (_.isUndefined(v) || _.isNull(v)) ? 
                0 : 
                parseFloat(v.replace(/\,/g, '')); 
            } 
          },          
          { 
            name: "lon", 
            type: "number", 
            // Define a helper for pre-processing numeric values - 
            // ensures empty cells are set to 0 and the rest are 
            // stripped of commas and turned to floats
            before: function(v){
              return (_.isUndefined(v) || _.isNull(v)) ? 
                0 : 
                parseFloat(v.replace(/\,/g, '')); 
            } 
          },
          { 
            name: "name", 
            type: "string" 
          }

        ]


        // Define the underlying dataset for this interactive, a CSV file containing 
        // all schools
        // (source = )
        SchoolMaps.schools = new Miso.Dataset({
          
          url: "data/schools.tsv",
          delimiter: ",",
          columns: SchoolMaps.schoolColumns,
          
          ready : function() {
            console.log('Links Ready!')
          }
        });

        SchoolMaps.links = new Miso.Dataset({

          url: "data/links.csv",
          delimiter: ",",

          ready : function() {
            console.log("Links Ready!")
          }

        })

        _.when(SchoolMaps.schools.fetch(), SchoolMaps.links.fetch()).then(function() {
          console.log("data loaded")
          SchoolMaps.app = new SchoolMaps.Views.Main();
          SchoolMaps.app.render();
        });
        // SchoolMaps.schools.fetch({
        //   success : function() {
        //     console.log("data loaded", this.toJSON())
        //     SchoolMaps.app = new SchoolMaps.Views.Main();
        //     SchoolMaps.app.render();
        //   },

        //   error: function(){
        //     SchoolMaps.app.views.title.update("Failed to load data from " + schools.url);
        //   }
        // });

      }
    })
  };




  SchoolMaps.Views.Main = Backbone.View.extend({
    initialize : function() {
      this.views = {};
    },

    render : function() {
      // this.views.title = new SchoolMaps.Views.Title();
      // this.views.footer = new SchoolMaps.View.Footer();
      // this.views.dateranges = new SchoolMaps.Views.DateRanges();
      this.views.map = new SchoolMaps.Views.Map();

      // this.views.title.render();
      // this.views.dateranges.render();
      this.views.map.render();
    } 

  });

  SchoolMaps.Views.Map = Backbone.View.extend({

    el: '#map',
    initialize: function(options) {

    },




    render : function () {
      var po = org.polymaps;
      var container = d3.select("#map").append("svg:svg").node();
      var center = {lon: -98.5795, lat: 37.828175};

      var map = po.map()
          .container(container)
          .zoom(4.5)
          .center(center)
          .add(po.interact());

      var pt = map.locationPoint({lat: 0, lon: 0});

      console.log([pt.x, pt.y])

      var projection = d3.geo.mercator()
        .translate([pt.x, pt.y])
        .scale(Math.pow(2, 4.5) * 256)


      var greatArc = d3.geo.greatArc()
        .source(function(d) { return d.from})
        .target(function(d) { return d.to});
      var path = d3.geo.path().projection(projection); 


      var data = SchoolMaps.schools.toJSON();
      // console.log(data)

      var links = SchoolMaps.Utils.getLinks();

        // Create the map object, add it to #map

        // Add the CloudMade image tiles as a base layer
      map.add(po.image()
          .url(po.url("http://{S}tile.cloudmade.com"
          + "/cab4b4cb386f4890b042a94ef2b87332" // http://cloudmade.com/register
          // + "/2400/256/{Z}/{X}/{Y}.png")
          // + "/77933/256/{Z}/{X}/{Y}.png")
          + "/15434/256/{Z}/{X}/{Y}.png")
          .hosts(["a.", "b.", "c.", ""])));

        // Add the compass control on top.
      map.add(po.compass()
          .position("bottom-left")
          .pan("small"));

      var colorScale = d3.scale.linear()
        .range(["#A5EDDA", "#FE326B"])


      // Insert our layer beneath the compass.
      var schoolsLayer = d3.select("#map svg").insert("svg:g", ".compass").attr("class", "schools");

      // Add an svg:g for each station.
      var marker = schoolsLayer.selectAll("g")
          .data(data)
        .enter().append("svg:g")
          .attr("transform", transform);

      // Add a circle.
      marker.append("svg:circle")
          .style("stroke", "#70A194")
          .style("fill", function(d) {
            return colorScale(0);
          })
          .attr("r", 4.5);

      // Add a label.
      marker.append("svg:text")
          .attr("x", 7)
          .attr("dy", ".31em")
          .text(function(d) { return d.name.substring(0,1); });

      // insert another layer
      var linksLayer = d3.select("#map svg").insert("svg:g", ".compass").attr("class", "links");

      var link = linksLayer.selectAll("g")
          .data(links)
          .enter()
          .append("svg:path")
          .style("opacity", "0.1")
          .style("stroke", "#FE326B")
          .attr("class", "link");

      link.attr("d", function(d) {
        return path(greatArc(d))
      })



      // Whenever the map moves, update the marker positions.
      map.on("move", function() {
        updateProjection();
        schoolsLayer.selectAll("g").attr("transform", transform);
        linksLayer.selectAll("path").attr("d", function(d) {
            return path(greatArc(d))
          })
      });
      
      // do the same when we resize the map
      map.on("resize", function() {
        updateProjection();
        schoolsLayer.selectAll("g").attr("transform", transform);
        linksLayer.selectAll("path").attr("d", function(d) {
            return path(greatArc(d))
          })
      });


      function transform(d) {
        var pt = {lon: d.lon, lat: d.lat}
        var dt = map.locationPoint(pt);
        return "translate(" + dt.x + "," + dt.y + ")";
      }

      function updateProjection() {
        var zero = map.locationPoint({lat: 0, lon: 0});
        zero = [zero.x, zero.y]
        scale = map.zoom()
        projection
          .translate(zero)
          .scale(Math.pow(2, scale) * 256);

      }
      


    }

  })


  SchoolMaps.Utils = {

    getLinks: function() {
      links = [];
      SchoolMaps.links.rows(function(row) {
        var from = SchoolMaps.Utils.getSchoolById(row.from);
        var to = SchoolMaps.Utils.getSchoolById(row.to);
        from = [from[0].lon, from[0].lat];
        to = [to[0].lon, to[0].lat];
        links.push({from:from, to:to});
      });

      console.log(links)

      return links;
    },

    getSchoolById: function(id) {
      var rows = SchoolMaps.schools.rows(function(row) {
          return (row.id == id);
        });

      return rows.toJSON()

    }

    
  }







  // Kick off application.
  var mainRoute = new SchoolMaps.Router();
  Backbone.history.start();

  return 'hey!'


});