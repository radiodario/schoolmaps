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
          
          url: "data/schools.csv",
          delimiter: ',',
          //columns: SchoolMaps.schoolColumns,
          
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
          console.log("data loaded", SchoolMaps.schools.toJSON())
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
    el: 'body',
    initialize : function() {
      this.views = {};
    },
    events: {
      'change #slide' : 'onSlide'
    },
    render : function() {
      // this.views.title = new SchoolMaps.Views.Title();
      // this.views.footer = new SchoolMaps.View.Footer();
      // this.views.dateranges = new SchoolMaps.Views.DateRanges();
      this.views.map = new SchoolMaps.Views.Map();
      this.views.years = new SchoolMaps.Views.Years();
      // this.views.title.render();
      // this.views.dateranges.render();
      this.views.map.render();
      this.views.years.render();
    },
    onSlide: function(event) {
      var year = +event.target.value;
      console.log(year);
      $('#year').html(year);
      this.views.map.setYear(year)
    }

  });

  SchoolMaps.Views.Years = Backbone.View.extend({
    el: '#slider',
    template: _.template($('#slider-template').html()),

    initialize: function(options) {

    },
    render: function() {
      $(this.el).html(this.template())
    }
  });


  SchoolMaps.Views.Map = Backbone.View.extend({

    el: '#map',
    initialize: function(options) {
      this.container = d3.select("#map").append("svg:svg").node();
      this.scale = d3.scale.linear().range([5,30]).domain([0,1500]);
      this.colorScale = d3.scale.linear()
        .range(["#FE326B","#888","#64C832"]).domain([-50,0,50])
        //.range(["#FE326B", "#FE326B"])
      this.year = 2010;
      this.po = org.polymaps;
      this.center = {lat: 40.00, lon:-75.1642};
      this.map = this.po.map()
          .container(this.container)
          .zoom(11)
          .center(this.center)
          .add(this.po.interact());

      pt = this.map.locationPoint({lat: 0, lon: 0});

      console.log([pt.x, pt.y])

      this.projection = d3.geo.mercator()
        .translate([pt.x, pt.y])
        .scale(Math.pow(2, this.map.zoom()) * 256)


      this.greatArc = d3.geo.greatArc()
        .source(function(d) { return d.from})
        .target(function(d) { return d.to});
      this.path = d3.geo.path().projection(this.projection); 

              // Add the CloudMade image tiles as a base layer
      this.map.add(this.po.image()
          .url(this.po.url("http://{S}tile.cloudmade.com"
          + "/cab4b4cb386f4890b042a94ef2b87332" // http://cloudmade.com/register
           // + "/2400/256/{Z}/{X}/{Y}.png")
           //+ "/77933/256/{Z}/{X}/{Y}.png")
           // + "/31408/256/{Z}/{X}/{Y}.png")
           + "/53991/256/{Z}/{X}/{Y}.png")
          .hosts(["a.", "b.", "c.", ""])));

        // Add the compass control on top.
      this.map.add(this.po.compass()
          .position("bottom-left")
          .pan("small"));


    },
    render : function () {
      
      //var center = {lon: -98.5795, lat: 37.828175};
      var that = this;
      var year = this.year

      var data = SchoolMaps.schools.where({

        columns: ['lat', 'lon', 'name', 'students', 'year', 'attainment'],

        // and only where the values are > 1
        rows: function(row) {
          return row.year == year;
        }
      }).toJSON();
      console.log(data)

      //this.scale.domain(d3.extent(data, function(d) {return d.students}));

      //var links = SchoolMaps.Utils.getLinks(year);
      var links = []
        // Create the map object, add it to #map


      




      // Insert our layer beneath the compass.
      var schoolsLayer = d3.select("#map svg").selectAll('g.schools').data([data])

      schoolsLayer.enter().insert("svg:g", ".compass").attr("class", "schools");

      // Add an svg:g for each station.
      var marker = schoolsLayer.selectAll("g.marker")
          .data(function(d) { return d });


      var markerExit = marker.exit()

      markerExit.remove();
      var fmt = d3.format('n');
      var markerEnter = marker.enter().append("svg:g").attr("class","marker")
          .attr("rel", "tooltip")
          .attr("title", function(d) { 
            var str = d.name + " - std:" + d.students + " - att:" + fmt(d.attainment);
            return str
          })
          .attr("transform", function(d) {
            return that.transform(d);
          });

      // Add a circle.
      markerEnter.append("svg:circle")
          .style("stroke", "#70A194")
          .style("opacity", 0.5)
          .style("fill", function(d) {
            return that.colorScale(d.attainment);
          })
          .attr("r", function (d) {
            return that.scale(d.students);
          });

      // Add a label.
      // marker.append("svg:text")
      //     .attr("x", 7)
      //     .attr("dy", ".31em")
      //     .text(function(d) { 
      //       //return '';
      //       return d.name;//.substring(0,1); 
      //     });

      // insert another layer
      var linksLayer = d3.select("#map svg").insert("svg:g", ".compass").attr("class", "links");

      var link = linksLayer.selectAll("g")
          .data(links)

      link.enter()
          .append("svg:path")
          .style("opacity", "0.1")
          .style("stroke", "#FE326B")
          .attr("class", "link");


      link.exit().remove();

      var map = this.map;

      link.attr("d", function(d) {
        return that.path(that.greatArc(d))
      })


      // Whenever the map moves, update the marker positions.
      map.on("move", function() {
        that.updateProjection();
        schoolsLayer.selectAll("g.marker").attr("transform", function(d) {
          return that.transform(d)
          });
        linksLayer.selectAll("path").attr("d", function(d) {
            return that.path(that.greatArc(d))
          })
      });
      
      // do the same when we resize the map
      map.on("resize", function() {
        that.updateProjection();
        schoolsLayer.selectAll("g.marker").attr("transform", function(d) {
          return that.transform(d)
          });
        linksLayer.selectAll("path").attr("d", function(d) {
            return that.path(that.greatArc(d))
          })
      });

      
      $(".marker").tooltip();
    },
    setYear : function(year) {
      this.year = year;
      this.render();
    },
    transform : function(d) {
        var pt = {lon: d.lon, lat: d.lat}
        var dt = this.map.locationPoint(pt);
        return "translate(" + dt.x + "," + dt.y + ")";
    },

    updateProjection : function () {
        var zero = this.map.locationPoint({lat: 0, lon: 0});
        zero = [zero.x, zero.y]
        var zoom = this.map.zoom();
        this.projection
          .translate(zero)
          .scale(Math.pow(2, zoom) * 256);

      }

  })


  SchoolMaps.Utils = {

    getLinks: function(year) {
      links = [];
      var rows = SchoolMaps.links.where({
        rows: function(row) {
          var date = new Date(row.date);
          return (date.getFullYear() === year)
          //return true;
        }
      }).toJSON();
      console.log(rows.length, "ROWS GRABBED for year", year);

      rows.forEach(function(row) {
        var from = SchoolMaps.Utils.getSchoolById(row.from);
        var to = SchoolMaps.Utils.getSchoolById(row.to);
        try {
          from = [from[0].lon, from[0].lat];
          to = [to[0].lon, to[0].lat];
          links.push({from:from, to:to});
        } catch (e) {
          //console.log("throwing away row");
        }
      })
      console.log(links)

      return links;
    },

    getSchoolById: function(id) {
      var rows = SchoolMaps.schools.rows(function(row) {
          return (row.instid == id);
        });
      return rows.toJSON()

    }

    
  }







  // Kick off application.
  var mainRoute = new SchoolMaps.Router();
  Backbone.history.start();

  return 'hey!'


});