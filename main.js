const { app, BrowserWindow, Menu, Tray } = require('electron')
const electron = require('electron')
const globalShortcut = electron.globalShortcut

const fs = require("fs");

var currentInput;

// Asynchronous read inputs and outputs
var inputs;
fs.readFile('q&a/inputs.txt', function (err, data) {
  if (err) {
    return console.error(err);
  }
  inputs = data.toString().replace(/(\r\n|\n|\r)/gm,"").split(";");
  //console.log("Asynchronous read: " + data.toString());
});

var responses;
fs.readFile('q&a/responses.txt', function (err, data) {
  if (err) {
    return console.error(err);
  }
  responses = data.toString().split("\n");
  //console.log("Asynchronous read: " + data.toString());
});



var path = require('path')
//var url = require('url')
var iconpath = path.join(__dirname, 'icon.png') // path of y

// Synchronous read
//var data = fs.readFileSync('input.txt');
//console.log("Synchronous read: " + data.toString());
//console.log("Program Ended");
var win;
function createWindow () {

  // Create the browser window.
  win = new BrowserWindow({
    width: 400,
    height: 500,
	transparent: true,
	frame: false,
	x:3430,
	y:580,
  icon: './icon.png',
	alwaysOnTop:true,
	resizable:false,
    webPreferences: {
      nodeIntegration: true
    }
  })



    var appIcon = new Tray("./icon.png")
    //appIcon.setPressedImage
    var contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show App', click: function () {
                win.show()
            }
        },
        {
            label: 'Quit', click: function () {
                app.isQuiting = true
                app.quit()
            }
        }
    ])

    appIcon.setContextMenu(contextMenu);

  win.on('minimize',function(event){
      event.preventDefault();
      win.hide();
  });

  win.on('close', function (event) {
      if(!app.isQuiting){
          event.preventDefault();
          win.hide();
      }

      return false;
  });


	//Add refresh shortcut
  globalShortcut.register('ctrl+shift+a', function() {
		console.log('App Refreshed')
		win.show();
	})
	globalShortcut.register('f5', function() {
		console.log('App Refreshed')
		win.reload()
	})
	globalShortcut.register('escape', function() {
		console.log('Leaving')
		//app.quit();
    win.hide();
	})
	globalShortcut.register('f7', function() {
		console.log('Showing console')
		win.webContents.openDevTools()
	})



	//globalShortcut.register('enter', function(){
		//sendMessage();
	//})
  // and load the index.html of the app.
  win.loadFile('index.html')
  // Open the DevTools.

}




//console.log(stringSimilarity.compareTwoStrings("healed", "salad"));

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow)


// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    //app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

var currentMessage;
function readAnswers(message){
  if(message.startsWith("!")){
    currentMessage = message;
    win.webContents.send('statusUpdate', message.substring(1,message.length));
  }else{
    console.log(message);

  }
}

const { Worker, isMainThread } = require("worker_threads");

function runService(workerData) {
  const worker = new Worker("./service.js", { workerData });
  //worker.postMessage(workerData);
  worker.on("message", incoming => readAnswers(incoming));
  worker.onerror = function (event) {
		console.log(event);
	}
  worker.on("exit", code =>
    console.log(`Worker stopped with exit code ${code}`)
  );
  //worker.postMessage("exit");
  //setTimeout(() => worker.postMessage("you won't see me"), 100);
}


async function run() {
const result = runService({currentInput,inputs,responses});
  //console.log({ isMainThread });
}

run().catch(err => console.error(err));


const { ipcMain } = require('electron')
ipcMain.on('asynchronous-query', (event, arg) => { //When an input is given
	if(arg != ""){
		currentInput = arg;
		run();
		//event.reply('asynchronous-reply', currentMessage);
	}

})

ipcMain.on('synchronous-message', (event, arg) => {
  console.log(arg) // prints "ping"
  event.returnValue = 'Sync return';
})



/*
//Speech to text
var SpeechRecognition = BrowserWindow.webkitSpeechRecognition;

var recognition = new SpeechRecognition();

var Textbox = $('#textbox');
var instructions = $('instructions');

var Content = '';

recognition.continuous = true;

recognition.onresult = function(event) {

  var current = event.resultIndex;

  var transcript = event.results[current][0].transcript;

    Content += transcript;
    Textbox.val(Content);

};

recognition.onstart = function() {
  instructions.text('Voice recognition is ON.');
}

recognition.onspeechend = function() {
  instructions.text('No activity.');
}

recognition.onerror = function(event) {
  if(event.error == 'no-speech') {
    instructions.text('Try again.');
  }
}

document.getElementById("body").on('click', function(e) {
  if (Content.length) {
    Content += ' ';
  }
  recognition.start();
});

Textbox.on('input', function() {
  Content = $(this).val();
})
*/
