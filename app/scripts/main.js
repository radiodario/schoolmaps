require.config({
  shim: {
  },

  paths: {
    jquery: 'vendor/jquery.min',
    d3: 'vendor/d3.v2',
    polymaps: 'vendor/polymaps'
  }
});
 
require(['app'], function(app) {
  // use app here
  console.log(app);
});