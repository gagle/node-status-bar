status-bar
==========

#### A status bar for file transfers ####

[![npm][npm-image]][npm-url]
[![david][david-image]][david-url]

#### Example ####

```javascript
var path = require('path');
var http = require('http');
var statusBar = require('status-bar');

var url = 'http://nodejs.org/dist/latest/node.exe';
var bar;

http.get(url, function (res) {
  bar = statusBar.create({ total: res.headers['content-length'] })
      .on('render', function (stats) {
        process.stdout.write(
            path.basename(url) + ' ' +
            this.format.storage(stats.currentSize) + ' ' +
            this.format.speed(stats.speed) + ' ' +
            this.format.time(stats.elapsedTime) + ' ' +
            this.format.time(stats.remainingTime) + ' [' +
            this.format.progressBar(stats.percentage) + '] ' +
            this.format.percentage(stats.percentage));
        process.stdout.cursorTo(0);
      });
  
  res.pipe(bar);
}).on('error', function (err) {
  if (bar) bar.cancel();
  console.error(err);
});

/*
It will print something like this:

node.exe    2.8 MiB  617.5K/s 00:06 00:07 [############············]  51%
*/
```

#### Why you should try this module ####

- It doesn't print anything, it just calculates and returns raw data and provides default formatting functions.
- The status bar can be displayed wherever you want, it is simply a string, so you can render it in the console, in HTML (probably with your own progress bar) via websockets or [NW.js][nwjs], etc.
- You decide how to format and arrange the elements. The default formatting functions have a fixed length, so you can format the status bar very easily.
- It is very easy to use. Just `pipe()` things to it!

#### Render function examples ####

- `pacman` from Arch Linux:
  
  ```
  a-file                  21.8 MiB   67.9M/s 00:03 [#####···················]  22%
  ```

  ```javascript
  var statusBar = require('status-bar');
  
  var formatFilename = function (filename) {
    //80 - 59
    var filenameMaxLength = 21;
    if (filename.length > filenameMaxLength) {
      filename = filename.slice(0, filenameMaxLength - 3) + '...';
    } else {
      var remaining = filenameMaxLength - filename.length;
      while (remaining--) {
        filename += ' ';
      }
    }
    return filename;
  };
  
  filename = formatFilename(filename);
  
  var bar = statusBar.create({ total: ... })
      .on('render', function (stats) {
        process.stdout.write(filename + ' ' + 
            this.format.storage(stats.currentSize) + ' ' +
            this.format.speed(stats.speed) + ' ' +
            this.format.time(stats.remainingTime) + ' [' +
            this.format.progressBar(stats.percentage) + '] ' +
            this.format.percentage(stats.percentage));
        process.stdout.cursorTo(0);
      });
      
  readableStream.pipe(bar);
  ```

- `git clone`:
  
  ```
  Receiving objects: 18% (56655992/311833402), 54.0 MiB | 26.7M/s
  ```

  ```javascript
  var statusBar = require('status-bar');
  
  var bar = statusBar.create({ total: ...})
      .on('render', function (stats) {
        process.stdout.write('Receiving objects: ' +
            this.format.percentage(stats.percentage).trim() +
            ' (' + stats.currentSize + '/' + stats.totalSize + '), ' +
            this.format.storage(stats.currentSize).trim() + ' | ' +
            this.format.speed(stats.speed).trim());
        process.stdout.cursorTo(0);
      });
  
  readableStream.pipe(bar);
  ```

#### Functions ####

- [_module_.create(options) : StatusBar](#create)

#### Objects ####

- [StatusBar](#statusbar_object)

---

<a name="create"></a>
___module_.create(options) : StatusBar__

Returns a new [StatusBar](#statusbar_object) instance.

Options:

- __frequency__ - _Number_  
  The rendering frequency in milliseconds. It must be a positive value. Default is 200.
- __progressBarComplete__ - _String_  
  The character that shows completion progress. Default is `#`.
- __progressBarIncomplete__ - _String_  
  The character that shows the remaining progress. Default is `·`.
- __progressBarLength__ - _Number_  
  The length of the progress bar. Default is 24.
- __total__ - _Number_  
  The total size of the file. This option is required.

---

<a name="statusbar_object"></a>
__StatusBar__

The `StatusBar` object inherits from a writable stream.

__Events__

- [finish](#event_finish)
- [hangup](#event_hangup)
- [render](#event_render)

__Methods__

- [StatusBar#cancel() : undefined](#statusbar_cancel)

__Properties__

- [StatusBar#format : Formatter](#statusbar_format)

---

<a name="event_finish"></a>
__finish__

Arguments: none.

Emitted when the transfer finishes.

<a name="event_hangup"></a>
__hangup__

Arguments: none.

Emitted when the transfer hangs up (3 seconds without receiving data). Can be emitted multiple times.

<a name="event_render"></a>
__render__

Arguments: `stats`.

Emitted when the status bar needs to be rendered. All the properties of the `stats` object contain raw data so you need to format them. You can use the default formatting functions.

Stats:

- __currentSize__ - _Number_  
The current size in bytes.
- __remainingSize__ - _Number_  
The remaining size in bytes.
- __totalSize__ - _Number_  
The total size in bytes.
- __percentage__ - _Number_  
The progress percentage (current/total size). A number between 0 and 1.
- __speed__ - _Number_  
The current speed in bytes per second.
- __elapsedTime__ - _Number_  
The elapsed time in seconds.
- __remainingTime__ - _Number_  
The estimated remaining time in seconds. If the remaining time cannot be estimated because the status bar needs at least 2 chunks of data or because the transfer it's hung up, it returns `undefined`.

---

<a name="statusbar_cancel"></a>
__StatusBar#cancel() : undefined__

When you need to cancel the rendering of the status bar because the transfer has been aborted due to an error or any other reason, call to this function to clear the internal timers.

---

<a name="statusbar_format"></a>
__StatusBar#format : Formatter__

Returns a [Formatter](#formatter) instance.

---

<a name="formatter"></a>
__Formatter__

__Methods__

- [Formatter#percentage(percentage) : String](#formatter-percentage)
- [Formatter#progressBar(percentage) : String](#formatter-progressBar)
- [Formatter#speed(bytesPerSecond) : String](#formatter-speed)
- [Formatter#storage(bytes) : String](#formatter-storage)
- [Formatter#time(seconds) : String](#formatter-time)

---

<a name="formatter-percentage"></a>
__Formatter#percentage(percentage) : String__

The percentage must be a number between 0 and 1. Result string length: 4.

```javascript
console.log(this.format.percentage(0.5));
/*
50%
 */
```

---

<a name="formatter-progressbar"></a>
__Formatter#progressBar(percentage) : String__

The percentage must be a number between 0 and 1. Result string length: the length configured with the option `progressBarLength`.

```javascript
console.log(this.format.progressBar(0.06));
/*
#·······················
 */
```

---

<a name="formatter-speed"></a>
__Formatter#speed(bytesPerSecond[, decimals]) : String__

By default it shows 1 decimal. Result string length: 8 + #decimals.

```javascript
console.log(this.format.speed(30098226));
/*
  30.1M/s
 */
```

---

<a name="formatter-storage"></a>
__Formatter#storage(bytes[, decimals]) : String__

By default it shows 1 decimal. Result string length: 9 + #decimals.

```javascript
console.log(this.format.storage(38546744));
/*
  36.8 MiB
 */
```

---

<a name="formatter-time"></a>
__Formatter#time(seconds) : String__

Result string length: 5 (_min_:_sec_). If `seconds` is undefined it prints `--:--`.

```javascript
console.log(this.format.time(63));
/*
01:03
 */
```

[npm-image]: https://img.shields.io/npm/v/status-bar.svg?style=flat
[npm-url]: https://npmjs.org/package/status-bar
[david-image]: https://img.shields.io/david/gagle/node-status-bar.svg?style=flat
[david-url]: https://david-dm.org/gagle/node-status-bar
[nwjs]: https://github.com/nwjs/nw.js