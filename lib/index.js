"use strict";

var util = require ("util");
var stream = require ("stream");
var pbf = require ("progress-bar-formatter");

module.exports.create = function (options){
  return new StatusBar (options);
};

var StatusBar = function (options){
  if (options.total === undefined || options.total === null){
    throw new Error ("Missing file size");
  }
  
  stream.Writable.call (this);
  
  this._total = options.total;
  this._frequency = options.frequency || null;
  this._finish = options.finish;
  this._progress = pbf.create ({
    completion: options.barCompletion,
    incompletion: options.barIncompletion,
    length: options.barLength
  });
  this._current = 0;
  this._timer = null;
  this._start = 0;
  this._chunkTimestamp = 0;
  
  this.stats = {
    total: this._total + ""
  };
  this._format ();
  
  if (options.write){
    this._render = options.write;
    options.write.call (this);
    if (this._frequency && this._total > 0){
      var me = this;
      this._timer = setInterval (function (){
        options.write.call (me);
      }, this._frequency);
    }
  }
};

util.inherits (StatusBar, stream.Writable);

StatusBar.prototype._write = function (chunk, encoding, cb){
  this.update (chunk);
  cb ();
};

var space = function (n){
  n += "";
  while (n.length < 6){
    n = " " + n;
  }
  return n;
};

var units = [" B  ", " KiB", " MiB", " GiB", " TiB", " PiB", " EiB", " ZiB",
    " YiB"];
var speeds = ["B/s", "K/s", "M/s", "G/s", "T/s", "P/s", "E/s", "Z/s", "Y/s"];

StatusBar.prototype._unit = function (n, arr, pow){
  if (n < pow) return space (n) + arr[0];
  var i = 1;
  while (i < 9){
    n /= pow;
    if (n < pow) return space (n.toFixed (1)) + arr[i];
    i++;
  }
  return ">=" + pow + arr[7];
};

StatusBar.prototype._formatSize = function (){
  return this._unit (this._current, units, 1024);
};

StatusBar.prototype._formatSpeed = function (bytes){
  if (bytes === undefined) return "     0B/s";
  return this._unit (~~bytes, speeds, 1000);
};

var zero = function (n){
  return n < 10 ? "0" + n : n;
};

StatusBar.prototype._formatTime = function (t){
  if (t === undefined) return this._current === this._total ? "00:00" : "--:--";
  var str;
  if (t >= 86400000) return " > 1d";
  if (t >= 3600000) return " > 1h";
  t /= ~~1000;
  var min = ~~(t/60);
  var sec = ~~(t%60);
  return zero (min) + ":" + zero (sec);
};

StatusBar.prototype._format = function (length){
  var elapsed;
  var now = Date.now ();
  var end = this._current === this._total;
  var n;
  
  this.stats.current = this._current + "";
  
  this.stats.size = this._formatSize ();
  
  //The transfer speed is extrapolated from the time between chunks
  if (this._chunkTimestamp){
    elapsed = process.hrtime (this._chunkTimestamp);
    elapsed = elapsed[0]*1e9 + elapsed[1];
    if (!end){
      //The last packet slows down the speed
      this.stats.speed = this._formatSpeed ((length*1e9)/elapsed);
    }
    this._chunkTimestamp = process.hrtime ();
  }else{
    this.stats.speed = this._formatSpeed ();
  }
  
  //The estimated remaining time uses the current file size
  if (this._start){
    n = end ? 0 : 1000;
    elapsed = now - this._start;
    var remaining = this._total - this._current;
    this.stats.eta = this._formatTime ((elapsed*remaining)/this._current + n);
  }else{
    this.stats.eta = this._formatTime ();
  }
  
  n = this._total === 0 ? 1 : this._current/this._total;
  this.stats.progress = this._progress.format (n);
  
  this.stats.percentage = Math.round (n*100) + "%";
  while (this.stats.percentage.length !== 4){
    this.stats.percentage = " " + this.stats.percentage;
  }
};

StatusBar.prototype.clearInterval = function (){
  clearInterval (this._timer);
};

StatusBar.prototype.update = function (chunk){
  if (!this._start) this._start = Date.now ();
  
  var length = chunk.length || chunk;
  this._current += length;
  
  this._format (length);
  
  if (!this._chunkTimestamp){
    this._chunkTimestamp = process.hrtime ();
  }
  
  if (!this._render) return;
  
  //Force a writing if there's no timer
  if (!this._timer) return this._render ();
  
  //Force a writing if the progress has finished and it has a timer
  if (this._current === this._total){
    this.clearInterval ();
    this._render ();
    if (this._finish) this._finish ();
  }
};