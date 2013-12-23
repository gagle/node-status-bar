status-bar
==========

#### A status bar for file transfers ####

[![NPM version](https://badge.fury.io/js/status-bar.png)](http://badge.fury.io/js/status-bar "Fury Version Badge")
[![Dependency Status](https://david-dm.org/gagle/node-status-bar.png)](https://david-dm.org/gagle/node-status-bar "David Dependency Manager Badge")

[![NPM installation](https://nodei.co/npm/status-bar.png?mini=true)](https://nodei.co/npm/status-bar "NodeICO Badge")

#### Example ####

```javascript
var statusBar = require ("status-bar");

var bar = statusBar.create ({
  //Total file size
  total: size,
  //Render function
  render: function (stats){
    //Print the status bar as you like
    process.stdout.write (filename + " " + 
        statusBar.format.storage (stats.currentSize) + " " +
        statusBar.format.speed (stats.speed) + " " +
        statusBar.format.time (stats.remainingTime) + " [" +
        stats.progressBar + "] " +
        statusBar.format.percentage (stats.percentage));
    process.stdout.cursorTo (0);
  }
});

//Update the status bar when you send or receive a chunk of a file
obj.on ("some-event", function (chunk){
  //You can pass any object that contains a length property or a simple number
  bar.update (chunk);
});

//Or simply pipe() things to it!
stream.pipe (bar);

//It will print something like this
//a-file                  17.8 MiB   23.6M/s 00:13 [#·······················]   6%
```

#### Why you should try this module ####

- It doesn't print anything, it just calculates and returns raw data and provides default formatting functions. Other modules similar to this force you to use their own formatting functions with the `readline` module, which is very unstable and may cause problems if you are already using a `readline` instance.
- The status bar can be displayed wherever you want, it is simply a string, so you can render it in the console, in HTML (probably with your own progress bar) sending it via websockets or with [node-webkit](https://github.com/rogerwang/node-webkit), etc.
- You decide how format and arrange the elements of the status bar. The default formatting functions have a fixed length, so you can format the status bar very easily.
- It is very easy to use. Just `pipe()` things to it!

#### Render function examples ####

- `pacman` from Arch Linux:
  
  ```
  a-file                  17.8 MiB   23.6M/s 00:13 [#·······················]   6%
  ```

  ```javascript
  var statusBar = require ("status-bar");
  
  var formatFilename = function (filename){
    //80 - 59
    var filenameMaxLength = 21;
    if (filename.length > filenameMaxLength){
      filename = filename.slice (0, filenameMaxLength - 3) + "...";
    }else{
      var remaining = filenameMaxLength - filename.length;
      while (remaining--){
        filename += " ";
      }
    }
    return filename;
  };
  
  filename = formatFilename (filename);
  
  var render = function (stats){
    process.stdout.write (filename + " " + 
        statusBar.format.storage (stats.currentSize) + " " +
        statusBar.format.speed (stats.speed) + " " +
        statusBar.format.time (stats.remainingTime) + " [" +
        stats.progressBar + "] " +
        statusBar.format.percentage (stats.percentage));
    process.stdout.cursorTo (0);
  };
  
  var bar = statusBar.create ({
    total: ...,
    render: render
  });
  ```

- `git clone`:
  
  ```
  Receiving objects: 18% (56655992/311833402), 54.0 MiB | 26.7M/s
  ```

  ```javascript
  var statusBar = require ("status-bar");
  
  var render = function (stats){
    process.stdout.write ("Receiving objects: " +
        statusBar.format.percentage (stats.percentage).trim () +
        " (" + stats.currentSize + "/" + stats.totalSize + "), " +
        statusBar.format.storage (stats.currentSize).trim () + " | " +
        statusBar.format.speed (stats.speed).trim ());
    process.stdout.cursorTo (0);
  };
  
  
  var bar = statusBar.create ({
    total: ...,
    render: render
  });
  ```

#### Functions ####

- [_module_.create(options) : StatusBar](#create)
- [_module_.format.percentage(percentage) : String](#format-percentage)
- [_module_.format.speed(bytesPerSecond) : String](#format-speed)
- [_module_.format.storage(bytes) : String](#format-storage)
- [_module_.format.time(seconds) : String](#format-time)

#### Objects ####

- [StatusBar](#statusbar_object)

---

<a name="create"></a>
___module_.create(options) : StatusBar__

Returns a new [StatusBar](#statusbar_object) instance.

Options:

- __finish__ - _Function_  
	Function that is called when the file transfer has finished.
- __frequency__ - _Number_  
  The rendering frequency in milliseconds. It must be a positive value. Default is 200.
- __progressBarComplete__ - _String_  
  The character that shows completion progress. Default is `#`.
- __progressBarIncomplete__ - _String_  
  The character that shows the remaining progress. Default is `·`.
- __progressBarLength__ - _Number_  
  The length of the progress bar. Default is 24.
- __render__ - _Function_  
	Function that is called when the status bar needs to be printed. It is required. It receives the stats oject as an argument. All of its properties contain raw data (except the progress bar), so you need to format them. You can use the default formatting functions.

  Properties:
  
  - __currentSize__ - _Number_  
  The current size in bytes.
  - __remainingSize__ - _Number_  
  The remaining size in bytes.
  - __totalSize__ - _Number_  
  The total size in bytes.
  - __percentage__ - _Number_  
  The complete percentage. A number between 0 and 1.
  - __speed__ - _Number_  
  The estimated current speed in bytes per second.
  - __elapsedTime__ - _Number_  
  The elapsed time in seconds.
  - __remainingTime__ - _Number_  
  The estimated remaining time in seconds. If the remaining time cannot be estimated because the status bar needs at least 2 chunks or because the transfer it's hung up, it returns `undefined`.
  - __progressBar__ - _String_  
  The progress bar.

    ```
    ######··················
    ```
  
- __total__ - _Number_  
  The total size of the file. This option is required.

---

<a name="format-percentage"></a>
___module_.format.percentage(percentage) : String__

The percentage must be a number between 0 and 1. Result string length: 4.

```javascript
console.log (statusBar.format.percentage (0.5));
// 50%
```

---

<a name="format-speed"></a>
___module_.format.speed(bytesPerSecond) : String__

Speed in bytes per second. Result string length: 9.

```javascript
console.log (statusBar.format.speed (30098226));
//  30.1M/s
```

---

<a name="format-storage"></a>
___module_.format.storage(bytes) : String__

Result string length: 10.

```javascript
console.log (statusBar.format.storage (38546744));
//  36.8 MiB
```

---

<a name="format-time"></a>
___module_.format.time(seconds) : String__

Result string length: 5 (_min_:_sec_). If `seconds` is undefined it prints `--:--`.

```javascript
console.log (statusBar.format.time (63));
//01:03
```

---

<a name="statusbar_object"></a>
__StatusBar__

__Methods__

- [StatusBar#cancel() : undefined](#statusbar_cancel)
- [StatusBar#update(chunk) : undefined](#statusbar_update)

---

<a name="statusbar_cancel"></a>
__StatusBar#cancel() : undefined__

When you need to cancel the status bar rendering because the file transfer has been aborted due to an error or any other reason, call to this function to clear the timer. This is only needed when the `frequency` option is configured.

---

<a name="statusbar_update"></a>
__StatusBar#update(chunk) : undefined__

Updates the status bar. The `chunk` can be any object with a length property or a simple number.