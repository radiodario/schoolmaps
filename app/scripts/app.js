define([], function() {

  // namespace
  var SchoolMaps = {
    Spinner : new Spinner({
        lines: 11, // The number of lines to draw
        length: 4, // The length of each line
        width: 2, // The line thickness
        radius: 6, // The radius of the inner circle
        rotate: 0, // The rotation offset
        color: '#000', // //rgb or //rrggbb
        speed: 1, // Rounds per second
        trail: 10, // Afterglow percentage
        shadow: false, // Whether to render a shadow
        hwaccel: true, // Whether to use hardware acceleration
        className: 'spinner', // The CSS class to assign to the spinner
        zIndex: 2e9, // The z-index (defaults to 2000000000)
        top: 'auto', // Top position relative to parent in px
        left: 'auto' // Left position relative to parent in px
      }),
    // container for our application views
    Views : {},
    // container for our application models
    Models : {},
    // application router
    Router : Backbone.Router.extend({

      routes : {
        "" : "index"
      },

      index : function() {
        var target = document.getElementById('map');
        console.log(target)
        SchoolMaps.Spinner.spin(target);
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
          
          url: "data/schools_agg.csv",
          delimiter: ',',
          //columns: SchoolMaps.schoolColumns,
          
          ready : function() {
            console.log('Links Ready!')
          }
        });

        SchoolMaps.links = new Miso.Dataset({

          url: "data/links_agg.tsv",
          delimiter: "\t",

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
    
    render : function() {
      // this.views.title = new SchoolMaps.Views.Title();
      // this.views.footer = new SchoolMaps.View.Footer();
      // this.views.dateranges = new SchoolMaps.Views.DateRanges();
      this.model = new SchoolMaps.Models.Year({year:2002, zips: true, migs: true});
      this.views.map = new SchoolMaps.Views.Map({model: this.model});
      this.views.years = new SchoolMaps.Views.Years({model: this.model});
      // this.views.title.render();
      // this.views.dateranges.render();
      this.views.map.render();
      this.views.years.render();
    }

  });

  SchoolMaps.Models.Year = Backbone.Model.extend();

  SchoolMaps.Views.Years = Backbone.View.extend({
    el: '#slider',
    template: _.template($('#slider-template').html()),
    events: {
      'click button#play' : 'playPause',
      'click button#migs' : 'migs',
      'click button#zips' : 'zips',
      'change #slide' : 'onSlide'
    },
    initialize: function(options) {
      this.model.bind('change', this.render, this)
      this.state = 'pause';
      var that = this;
      this.interval = setInterval(function() {
        that.yearStep()
      }, 1500);
    },
    render: function() {
      $(this.el).html(this.template(this.model.toJSON()))
      this.setButtonState();
    },
    playPause: function () {
      console.log ('hey!')
      if (this.state === 'pause') {
        this.state = 'play';
        this.setButtonState();
      } else {
        this.state = 'pause'
        this.setButtonState();
      } 
    },
    setButtonState: function() {
      if (this.model.get('zips')) {
        $('button#zips').addClass("active")
      } else {
        $('button#zips').removeClass("active")
      }
      if (this.model.get('migs')) {
        $('button#migs').addClass("active")
      } else {
        $('button#migs').removeClass("active")
      }
      if (this.state === 'play') {
        $('button#play').addClass("active")
        $('#playPause').removeClass("icon-play").addClass("icon-pause");
      } else {
        $('button#play').removeClass("active")
        $('#playPause').removeClass("icon-pause").addClass("icon-play").removeClass("active");
      } 
    },
    onSlide: function(event) {
      var year = +event.target.value;
      console.log(year);
      $('#year').html(year);
      this.model.set({year: year})
    },
    yearStep: function() {
      //console.log(this.state)
      if (this.state === 'play') {
        var year = this.model.get('year');
        if (year < 2012) {
          year++;
        } else {
          year = 2001;
        }
        this.model.set({year: year});
      }
    },
    zips: function() {
      if (this.model.get('zips')) {
        // $('button#zips').removeClass("active")
        this.model.set({zips:false});
      } else {
        // $('button#zips').addClass("active")
        this.model.set({zips:true});
      }
    },
    migs: function() {
      if (this.model.get('migs')) {
        // $('button#migs').removeClass("active")
        this.model.set({migs:false});
      } else {
        // $('button#migs').addClass("active")
        this.model.set({migs:true});
      }
    }

  });


  SchoolMaps.Views.Map = Backbone.View.extend({

    el: '#map',
    initialize: function(options) {
      this.model.bind('change', this.render, this);
      this.container = d3.select("#map").append("svg:svg").node();
      this.zipscale = d3.scale.linear().range([5,30]).domain([0,5000]);
      this.migscale = d3.scale.linear().range([0,10]).domain([0,100]);
      this.colorScale = d3.scale.linear()
        .range(["#FE326B","#888","#64C832"]).domain([-50,0,50])
        //.range(["#FE326B", "#FE326B"])
      this.po = org.polymaps;
      this.duration = 700;
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
      var year = this.model.get('year');


      var data = []
      if (this.model.get('zips')) {
        console.log('draw zips')
      var data = SchoolMaps.schools.where({
        columns: ['lat', 'lon', 'name', 'students', 'year', 'attainment'],
        // and only where the values are > 1
        rows: function(row) {
          return +row.year === +year;
        }
      }).toJSON();
      }

      var links = []
      if (this.model.get('migs')) {
        console.log('draw migs')
        var links = SchoolMaps.links.where({
          columns: ['olat', 'olon', 'dlat', 'dlon','students', 'oattainment', 'dattainment', 'studentsup',  'studentsdown',  'studentsame'],

          // and only where the values are > 1
          rows: function(row) {
            return +row.year === +year;
          }
        }).toJSON();
      }


      var fmt = d3.format('n');

      // Select our layer beneath the compass.
      var schoolsLayer = d3.select("#map svg").selectAll('g.schools').data([data])
      // if it's not there add it under the .compass
      schoolsLayer.enter().insert("svg:g", ".compass").attr("class", "schools");

      // Add an svg:g for each station.
      var marker = schoolsLayer.selectAll("circle")
          .data(function(d) { return d });


      marker.exit().selectAll('circle')
        .transition()
        .duration(this.duration)
        .attr("r", 0).remove()

      // add circles
      marker.enter()
          .append("svg:circle")
          .attr("class","marker")
          .attr("rel", "tooltip")
          .attr("r", 0)
          .attr("title", function(d) { 
            var str = "std:" + d.students + " - att:" + fmt(d.attainment);
            return str
          })
          .attr("transform", function(d) {
            return that.transform(d);
          })

      // update the circle sizes
      schoolsLayer.selectAll("circle")    
          .transition()
          .duration(this.duration)
          .style("stroke", "#70A194")
          .style("opacity", 0.5)
          .style("fill", function(d) {
            return that.colorScale(d.attainment);
          })
          .attr("r", function (d) {
            return that.zipscale(d.students);
          });



      var linksLayer = d3.select("#map svg").selectAll('g.links').data([links])
      linksLayer.enter().insert("svg:g", ".compass").attr("class", "links");

      var link = linksLayer.selectAll("path.link")
          .data(function(d) { return d; });

      link.enter()
          .append("svg:path")
          .attr("class", "link");

      link.exit()
        .remove();

      linksLayer.selectAll('path')
        .attr("d", function(d) {
          return that.path(that.greatArc({from:[d.olon, d.olat], to:[d.dlon, d.dlat]}))
        })
        .style("opacity", 0)
        .style("stroke-width", function(d) {
            return that.migscale(d.students)
          })
        .style("stroke", function(d) {
            return that.colorScale(d.dattainment);
          })
        .transition()
        .duration(this.duration)
        .style("opacity", 0.5)


      // Whenever the map moves, update the marker positions.
      this.map.on("move", function() {
        that.updateProjection();
        schoolsLayer.selectAll("circle.marker").attr("transform", function(d) {
          return that.transform(d)
          });
        linksLayer.selectAll("path").attr("d", function(d) {
            return that.path(that.greatArc({from:[d.olon, d.olat], to:[d.dlon, d.dlat]}))
          })
      });
      
      // do the same when we resize the map
      this.map.on("resize", function() {
        that.updateProjection();
        schoolsLayer.selectAll("circle.marker").attr("transform", function(d) {
          return that.transform(d)
          });
        linksLayer.selectAll("path").attr("d", function(d) {
           return that.path(that.greatArc({from:[d.olon, d.olat], to:[d.dlon, d.dlat]}))
          })
      });

      
      $(".marker").tooltip();
      SchoolMaps.Spinner.stop();
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
        zero = [zero.x, zero.y];
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