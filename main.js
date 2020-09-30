const { app, BrowserWindow, Menu, Tray, screen, net, nativeImage } = require('electron')
const electron = require('electron')
const globalShortcut = electron.globalShortcut
const fs = require("fs");
var execa = require("execa");
var currentInput;
var win;
const spotify = require('./spotify.js')
var dirPath = __dirname;
const greetings = ["Hey, %username%", "%username%, what's up?", "Wassup wassup", "You rang?"];

// Create Main Window
var screenWidth;
var screenHeight;
const xOffset = 15;
var winX;
var winY;
var appShowing = false;
function createWindow () {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  screenWidth = width;
  screenHeight = height;
  winX = width - cusW - xOffset;
  winY = height - cusH;
  // Create the browser window.
  win = new BrowserWindow({
    width: cusW,
    height: cusH,
	transparent: true,
	frame: false,
	x:winX,
	y:winY,
  icon: iconpath,
	alwaysOnTop:true,
	resizable:false,
    webPreferences: {
      nodeIntegration: true
    }
  })
  win.webContents.setUserAgent("Mozilla/5.0 (Linux; Android 4.2.1; en-us; Nexus 5 Build/JOP40D) AppleWebKit/535.19 (KHTML, like Gecko; googleweblight) Chrome/38.0.1025.166 Mobile Safari/535.19");
  win.on('minimize',function(event){
      event.preventDefault();
      win.hide();
  });
  win.on('blur', function(event){
    if(!alwaysOnTop){
      if(!spotifyMiniPlayer || !spotify.authorized){
        appShowing = false;
        win.webContents.send('slideOut')
        setTimeout(function(){
          win.hide();
        },500)
      }else{
        win.webContents.send('miniPlayer');
      }
    }
  })
  win.on('show', function(event){ // When reveling, check track for update
    if(spotify.authorized){
      checkSpotifyArt()
    }
  })
  win.on('close', function (event) {
      if(!app.isQuiting){
          //event.preventDefault();
          win.hide();
      }
      return false;
  });
  loadConfig();
	//Add refresh shortcut
  globalShortcut.register(assistantShortcut, function() {
    console.log('Bringing back app')
    if(state == "default"){
      win.show();
      appShowing = true;
    }else{
      console.log("switching state to default")
      win.webContents.send("switchState","default");
    }
    win.webContents.focus();
    win.webContents.send("focusInput");
  })
	globalShortcut.register('f7', function() {console.log('Showing console')
  win.webContents.openDevTools()})
  globalShortcut.register('f3', function() {getArtwork();})
  //globalShortcut.register('f2', function() {skipTrack();})
  globalShortcut.register('Ctrl+r', function() {win.webContents.send("switchState","configMenu");})
  globalShortcut.register('Ctrl+y', function() {win.webContents.send("switchState","browser");})
  globalShortcut.register('Ctrl+f5', function() {win.reload();})
  //win.webContents.send("switchState","default");
  win.loadFile('index.html')
  appShowing = true;
  // Open the DevTools.
  loaded = true;

  app.setName("Arizona");
  let tray = null
  tray = new Tray(iconpath)
  const contextMenu = Menu.buildFromTemplate([{
    label: 'Show',
    click: function(){
      win.show();
    }},
    {label: 'Exit',
    click: function(){
      app.quit();
    }
  }
  ])
  tray.setToolTip('Arizona')
  tray.setContextMenu(contextMenu)
  setTimeout(function(){
    win.webContents.send("statusUpdate", greetings[Math.floor(Math.random()*greetings.length)].replace("%username%", username));
  }, 1000)
  if(useSpotify){
    try {
      if (fs.existsSync(__dirname + "/spotifyAuth.txt")) {
        if(true){
          spotify.authorize(checkSpotifyArt)
          console.log("AH")
          var t=setInterval(checkSpotifyArt,15000);
        }
      }
    } catch(err) {
      console.error(err)
    }
    //spotifyAuth(); //Get access code
  }else{
    setTimeout(function(){win.webContents.send("hideControls");},3000);
  }
  if(!spotifyMiniPlayer){
    setTimeout(function(){win.webContents.send("hideControls");},3000);
  }
  setTimeout(function(){
    win.show();
  },1000)
}

function updateWindowPosition(w,h){
  if(!appShowing){
    win.show();
    appShowing = true;
  }
  let displays = screen.getAllDisplays()
  let externalDisplay = displays.find((display) => {
    return display.bounds.x !== 0 || display.bounds.y !== 0
  })
  console.log(w + " " + h)
  win.setResizable(true);
  win.setSize(w,h);
  win.setResizable(false);
  var { width, height } = screen.getPrimaryDisplay().workAreaSize
  const xOffset = 15;
  var winX = width - w - xOffset;
  var winY = height - h;
  if(secondScreen && externalDisplay){
    winX = (width * 2) - w - xOffset;
  }
  win.setPosition(winX,winY);
}

//Cal
var artworkURL;
var shouldUpdateTrack = true;
var songData;
function checkSpotifyArt(){
  if(spotify.authorized() && spotifyMiniPlayer){
    console.log("Checking for song change.");
    spotify.getTrackInfo(function(data){
      songData = data;
      console.log(data)
      win.webContents.send("artwork", data.split(";")[3])
    })

  }else{
    shouldUpdateTrack = true;
  }
}

async function getLyrics(){
  const solenolyrics = require('solenolyrics');
  let ourSong = await solenolyrics.requestLyricsFor(songData[1] + " " + songData[0]);
  if(ourSong != ""){
    win.webContents.send('lyrics',ourSong)
  }else{
    //win.webContents.send('statusUpdate',ourSong)
  }
}

function showGoogle(query){
  var link = "https://www.google.com/search?q=" +query.replace("google","").replace(" ","+");
  require("electron").shell.openExternal(link);
}

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  win.show()
  win.webContents.focus();
  win.webContents.send("focusInput");
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
  //win.webContents.send('slideIn', "Do it");
})

// Asynchronous read inputs and outputs
var inputs;
fs.readFile(dirPath + '/q&a/inputs.txt', function (err, data) {
  if (err) {
    return console.error(err);
  }
  inputs = data.toString().replace(/(\r\n|\n|\r)/gm,"").split(";");
  //console.log("Asynchronous read: " + data.toString());
});
var responses;
fs.readFile(dirPath + '/q&a/responses.txt', function (err, data) {
  if (err) {
    return console.error(err);
  }
  responses = data.toString().split("\n");
  //console.log("Asynchronous read: " + data.toString());
});
var location, username, assistantName, assistantShortcut, theme, cusW, cusH, secondScreen, useSpotify, spotifyMiniPlayer, showTitleOnMiniPlayer, alwaysOnTop;

// Config Logic
var configLoad = require("./loadConfig.js");
function loadConfig(){
  var initConfig = configLoad.config();
  username = initConfig["username"];
  assistantName = initConfig["assistantName"]
  assistantShortcut = initConfig["assistantShortcut"]
  cusW = initConfig["windowWidth"];
  cusH = initConfig["windowHeight"];
  cusW = parseInt(cusW);
  cusH = parseInt(cusH);
  secondScreen = (initConfig["secondScreen"] === 'true');
  useSpotify = (initConfig["useSpotify"] === 'true');
  spotifyMiniPlayer = (initConfig["spotifyMiniPlayer"]==='true');
  showTitleOnMiniPlayer = (initConfig["showTitleOnMiniPlayer"]==='true');
  alwaysOnTop = (initConfig["alwaysOnTop"]==='true');
  win.setAlwaysOnTop(alwaysOnTop);
  location = initConfig["location"]
  updateWindowPosition(cusW,cusH);
}

var loaded = false;
var path = require('path')
var iconpath = path.join(__dirname, 'extraResources', 'iconTiny.png') // path of y

// Process questions in service.js
const { Worker, isMainThread } = require("worker_threads");
var serviceScript = path.join(__dirname, 'extraResources','service.js');
function runService(workerData) {
  workerData["location"] = location;
  const worker = new Worker(serviceScript, { workerData });
  //worker.postMessage(workerData);
  worker.on("message", incoming => readAnswers(incoming));
  worker.onerror = function (event) {
		console.log(event);
	}
  worker.on("exit", code =>
    console.log(`Worker stopped with exit code ${code}`)
  );
}
async function run() {
  const result = runService({currentInput,inputs,responses});
}
var currentMessage;

//Handle return message from Arizona
function readAnswers(message){
  if(message.startsWith("!")){
    currentMessage = message.substring(1,message.length);
    currentMessage = currentMessage.replace("%username%", username);
    console.log(currentMessage);
    win.webContents.send('statusUpdate', currentMessage);
  }else if(message.startsWith("lyrics")){
    getLyrics();
  }else if(message == "options"){
    var configSave = readConfig();
    win.webContents.send('options', configSave);
  }else if(message.startsWith("google")){
    var search = message.split(":")[1];
    showGoogle(search);
  }else if(message.startsWith("skip")){
    if(spotify.authorized){
        spotify.next();
    }else{
      win.webContents.send('statusUpdate','Link your Spotify account to control your music')
    }
  }else if(message.startsWith("previous")){
    if(spotify.authorized){
      spotify.previous();
    }else{
      win.webContents.send('statusUpdate','Link your Spotify account to control your music!')
    }
  }else if(message.startsWith("play")){
    if(spotify.authorized){
      message = message.substring(5);
      spotify.play(message);
    }else{
      win.webContents.send('statusUpdate','Link your Spotify account to control your music!')
    }
  }else{
    console.log(message);
  }
}
var state = "default";
var setupQuestions = ["What's your name?","I can get the weather for you. What's a city near you? You don't have to tell me if you don't want to."];
var setupAnswers = [];
var scripts = ["setup", "restart-query"];
var cScript = 0;

// Handle Messages from renderer
const { ipcMain } = require('electron')
ipcMain.on('asynchronous-query', (event, arg) => { //When an input is given
  if(cScript == 0){
    if(arg != ""){
  		currentInput = arg;
  		run();
  	}
  }else if(cScript == 1){ // Setup

  }else if(cScript == 2){ // Restart-query
    if(arg == "yes" || arg == "y"){
      restartAndUpdate();
      cScript = 0;
    }else{
      cScript = 0;
      win.webContents.send("statusUpdate", "Ok, no problem.")
    }
  }
})
ipcMain.on('synchronous-message', (event, arg) => {
  console.log(arg) // prints "ping"
  event.returnValue = 'Sync return';
})
ipcMain.on('updateState', (event, arg) => {
    state = arg;
    console.log(state)
    if(state == "default"){
      updateWindowPosition(cusW, cusH);
    }else if(state == "miniplayer"){
      updateWindowPosition(cusW, cusH - 250);
    }
})
ipcMain.on('previousSong', (event, arg) => {
  if(spotify.authorized){
    spotify.previous(checkSpotifyArt);
  }
})
ipcMain.on('nextSong', (event, arg) => {
  if(spotify.authorized){
    spotify.skip(checkSpotifyArt);
  }
})
ipcMain.on('console', (event, arg) => {
  console.log("Renderer: " + arg)
})
ipcMain.on('toggleMusic', (event, arg) => { //Check playback state then change it
  if(spotify.authorized){
    spotify.toggleMusic();
  }
})
ipcMain.on('authMessage', (event, arg) => {
  console.log(arg) // prints "ping"
})
ipcMain.on('requestSpotifyAuth', (event, arg) => {
  spotify.authorize(checkSpotifyArt);
  console.log("Requesting Spotify Auth")
})

// Start the app and open the window
app.whenReady().then(function(){
  setTimeout(createWindow, 2000)
}
)
