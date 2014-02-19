"use strict";

var statusBar = require ("../lib");

var total = 10;
var update = 100;

var bar = statusBar.create ({ total: total });

bar.on ("render", function (stats){
  process.stdout.write (this.format.storage (stats.currentSize) + " " +
      this.format.speed (stats.speed) + " " +
      this.format.time (stats.elapsedTime) + " " +
      this.format.time (stats.remainingTime) + " [" +
      this.format.progressBar (stats.percentage) + "] " +
      this.format.percentage (stats.percentage));
  process.stdout.cursorTo (0);
});

(function again (i){
  setTimeout (function (){
    bar.write ("a");
    if (i--) again (i);
  }, update);
})(total);