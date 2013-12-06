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
	//Writing frequency
	frequency: 200,
	//Writing function
	write: function (){
		//Print the status bar as you like
		process.stdout.write (filename + " " + this.stats.size + " " +
				this.stats.speed + " " + this.stats.eta + " [" +
				this.stats.progress + "] " + this.stats.percentage);
		process.stdout.cursorTo (0);
	}
});

//Update the status bar when you send or receive a chunk of a file
.on ("some-event", function (chunk){
	//You can pass any object that contains a length property or a simple number
	bar.update (chunk);
});

//Or simply pipe() things to it!
stream.pipe (bar);

//It will print something like this
//a-file                  17.8 MiB   23.6M/s 00:13 [#·······················]   6%
```

#### Why you should try this module ####

- It doesn't print anything, it just formats the data and you decide how you want to print the status bar. Other modules similar to this use the `readline` module which is very unstable and may cause problems if you are already using a `readline` instance.
- You decide how to arrange the elements of the status bar. Because each element has a fixed length you can format the status bar very easily.
- It is very easy to use. Just `pipe()` things to it!

#### Functions ####

- [_module_.create(options) : StatusBar](#create)

#### Objects ####

- [StatusBar](#statusbar_object)

---

<a name="create"></a>
___module_.create(options) : StatusBar__

Returns a new [StatusBar](#statusbar_object) instance.

Options:

- __total__ - _Number_  
  The total size of a file. This option is required.
- __barComplete__ - _String_  
  The character that shows completion progress. Default is `#`.
- __barIncomplete__ - _String_  
  The character that shows the remaining progress. Default is `·`.
- __barLength__ - _Number_  
  The length of the progress bar. Default is `24`.
- __frequency__ - _Number_  
  The writing frequency. If you don't configure a `write` function, this option is ignored. By default there's no value, so each time you call to [update()](#statusbar_update), the status bar will be printed. This is the most accurate behaviour but it slowers so much the file transfer. I recommend to render the status bar every 200ms.
- __write__ - _Function_  
	Function that is called when the status bar needs to be printed.
- __finish__ - _Function_  
	Function that is called when the file transfer has finished.

---

<a name="statusbar_object"></a>
__StatusBar__

__Methods__

- [StatusBar#update(chunk) : undefined](#statusbar_update)

__Properties__

- [StatusBar#stats](#statusbar_stats)

---

<a name="statusbar_update"></a>
__StatusBar#update(chunk) : undefined__

Updates the status bar. `chunk` can be any object with a length property or a simple number.

---

<a name="statusbar_stats"></a>
__StatusBar#stats__

`stats` is an object that contains the current state of the status bar. It is updated each time you [update()](statusbar_update) the status bar. All the following properties are strings and have a fixed length.

- __size__ - _String_  
  The current size of the file that is being received/sent. Length: 10. Example: `  12.5 MiB`.
- __speed__ - _String_  
  The current file transfer speed. Length: 9. Example: `   5.3M/s`.
- __eta__ - _String_  
  The estimated remaining time. Length: 5. Example: `01:45` (<min>:<sec>).
- __progress__ - _String_  
  A progress bar with the current file completion. Length: configured with the `barLength` option. Example: `##########··············`.
- __percentage__ - _String_  
  The completion pertentage. Length: 4. Example: ` 89%`.