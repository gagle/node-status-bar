'use strict';

var util = require('util');
var stream = require('stream');
var PBF = require('progress-bar-formatter');

module.exports.create = function (options) {
  return new StatusBar(options);
};

var storage = [' B  ', ' KiB', ' MiB', ' GiB', ' TiB', ' PiB', ' EiB', ' ZiB',
    ' YiB'];
var speeds = ['B/s', 'K/s', 'M/s', 'G/s', 'T/s', 'P/s', 'E/s', 'Z/s', 'Y/s'];

var space = function (n, max) {
  n += '';
  var spaces = max - n.length;
  for (var i = 0; i < spaces; i++) {
    n = ' ' + n;
  }
  return n;
};

var unit = function (n, arr, pow, decimals) {
  var chars = decimals ? 5 + decimals : 4;
  if (n < pow) return space(n, chars) + arr[0];
  var i = 1;
  while (i < 9) {
    n /= pow;
    if (n < pow) return space(n.toFixed(decimals), chars) + arr[i];
    i++;
  }
  return '>=' + pow + arr[7];
};

var zero = function (n) {
  return n < 10 ? '0' + n : n;
};

var Formatter = function (statusBar) {
  this._statusBar = statusBar;
};

Formatter.prototype.storage = function (b, decimals) {
  return unit(Math.floor(b), storage, 1024,
      decimals === undefined ? 1 : decimals);
};

Formatter.prototype.speed = function (bps, decimals) {
  return unit(Math.floor(bps), speeds, 1000,
      decimals === undefined ? 1 : decimals);
};

Formatter.prototype.time = function (s) {
  if (s === undefined) return '--:--';
  if (s >= 86400) return ' > 1d';
  if (s >= 3600) return ' > 1h';
  var min = Math.floor(s / 60);
  var sec = Math.floor(s % 60);
  return zero(min) + ':' + zero(sec);
};

Formatter.prototype.percentage = function (n) {
  return space(Math.round(n * 100) + '%', 4);
};

Formatter.prototype.progressBar = function (n) {
  return this._statusBar._pbf.format(n);
};

var StatusBar = function (options) {
  if (options.total === undefined || options.total === null) {
    throw new Error('Missing file size');
  }

  stream.Writable.call(this);

  this.format = new Formatter(this);

  var me = this;
  this.on('unpipe', function () {
    me.cancel();
  });

  this._frequency = options.frequency || 200;
  this._pbf = new PBF({
    complete: options.progressBarComplete,
    incomplete: options.progressBarIncomplete,
    length: options.progressBarLength
  });
  this._hungUp = false;
  this._finished = false;
  this._current = 0;
  this._total = Math.floor(options.total);
  this._onRenderTimer = null;
  this._elapsedTimer = null;
  this._start = 0;
  this._chunkTimestamp = 0;
  this._secondsWithoutUpdate = 0;
  this._avgBytes = 0;
  this._lastElapsed = 0;

  // Smooth factors
  this._speedSmooth = 0.2;
  this._avgSmooth = 0.2;
  this._elapsedSmooth = 0.7;

  this._stats = {
    currentSize: 0,
    totalSize: this._total,
    remainingSize: this._total,
    speed: 0,
    elapsedTime: 0
  };

  var percentage;
  if (this._total === 0) {
    percentage = 1;
    this._stats.remainingTime = 0;
  } else {
    percentage = 0;
    // Undefined remainingTime
  }
  this._stats.percentage = percentage;

  if (this._total === 0) {
    this._finished = true;
    process.nextTick(function () {
      me.emit('render', me._stats);
      me.emit('finish');
    });
  } else {
    process.nextTick(function () {
      me.emit('render', me._stats);
      me._onRenderTimer = setInterval(function () {
        me.emit('render', me._stats);
      }, me._frequency);
    });
  }
};

util.inherits(StatusBar, stream.Writable);

StatusBar.prototype._write = function (chunk, encoding, cb) {
  if (this._finished) throw new Error('Total length exceeded');

  if (!this._start) this._start = Date.now();

  this._secondsWithoutUpdate = 0;
  this._hungUp = false;

  // Allow any object with a length property
  var length = chunk.length;
  this._current += length;
  this._avgBytes += length;

  this._updateStats(length);

  // High resolution time calculation between packets
  this._chunkTimestamp = process.hrtime();

  // Force a render if the transfer has finished
  if (this._current === this._total) {
    this.cancel();
    this.emit('render', this._stats);
    this.emit('finish');
  }

  cb();
};

StatusBar.prototype._updateStats = function (length) {
  var end = this._current === this._total;
  var elapsed;

  // The elapsed time needs to be calculated with a timer because if it's
  // calculated using the elapsed time from the start of the transfer, if the
  // transfer is hung up, the 'elapsedTime' property must still be updated each
  // second
  if (!this._elapsedTimer) {
    var me = this;
    this._elapsedTimer = setInterval(function () {
      me._stats.elapsedTime++;

      // Wait 3 seconds before considering a transfer hang up
      if (me._secondsWithoutUpdate === 3) {
        if (!me._hungUp) {
          me._hungUp = true;
          me._stats.speed = 0;
          me._stats.remainingTime = undefined;
          me._start = null;
          me._avgBytes = 0;
          me.emit('hangup');
        }
      } else {
        me._secondsWithoutUpdate++;
      }
    }, 1000);
  }

  this._stats.currentSize = this._current;
  this._stats.remainingSize = this._total - this._current;
  this._stats.percentage = this._current / this._total;

  // The speed and remaining time cannot be calculated only with the first
  // packet
  if (this._chunkTimestamp) {
    // The transfer speed is extrapolated from the time between chunks
    elapsed = process.hrtime(this._chunkTimestamp);
    // Elapsed in nanoseconds
    elapsed = elapsed[0] * 1e9 + elapsed[1];

    // Smooth the elapsed time
    this._lastElapsed = elapsed = (1 - this._elapsedSmooth) * elapsed +
        this._elapsedSmooth * this._lastElapsed;

    if (end) {
      this._stats.speed = 0;
      this._stats.remainingTime = 0;
    } else {
      // Bytes per second
      var speed = (length * 1e9) / elapsed;
      var lastSpeed = this._stats.speed || speed;

      // Smooth the speed
      speed = (1 - this._speedSmooth) * speed + this._speedSmooth * lastSpeed;

      // Elapsed in milliseconds
      elapsed = (Date.now() - this._start) * 0.001;

      // Use the average speed as a reference speed to smooth peaks even more
      var avgSpeed = this._avgBytes / elapsed;
      this._stats.speed = Math.floor((1 - this._avgSmooth) * speed +
          this._avgSmooth * avgSpeed);

      // Remaining time
      this._stats.remainingTime =
          Math.floor(this._stats.remainingSize / avgSpeed) + 1;
    }
  }
};

StatusBar.prototype.cancel = function () {
  clearInterval(this._onRenderTimer);
  clearInterval(this._elapsedTimer);
};