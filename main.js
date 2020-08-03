const { app, BrowserWindow, Menu, Tray, screen, net, nativeImage } = require('electron')
const electron = require('electron')
const globalShortcut = electron.globalShortcut
const fs = require("fs");
var execa = require("execa");
var currentInput;
var win;
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
var username, assistantName, assistantShortcut, theme, cusW, cusH, secondScreen, useSpotify, spotifyMiniPlayer, showTitleOnMiniPlayer;
//READ Config
function loadConfig(){
  var initConfig = readConfig();
  username = initConfig["username"];
  assistantName = initConfig["assistantName"]
  assistantShortcut = initConfig["assistantShortcut"]
  cusW = initConfig["windowWidth"];
  cusH = initConfig["windowHeight"];
  secondScreen = (initConfig["secondScreen"] === 'true');
  useSpotify = (initConfig["useSpotify"] === 'true');
  spotifyMiniPlayer = (initConfig["spotifyMiniPlayer"]==='true');
  showTitleOnMiniPlayer = (initConfig["showTitleOnMiniPlayer"]==='true');
  updateWindowPosition(parseInt(cusW),parseInt(cusH));
}

function updateWindowPosition(w,h){
  let displays = screen.getAllDisplays()
  let externalDisplay = displays.find((display) => {
    return display.bounds.x !== 0 || display.bounds.y !== 0
  })
  win.setSize(w,h);
  var { width, height } = screen.getPrimaryDisplay().workAreaSize
  const xOffset = 15;
  var winX = width - w - xOffset;
  var winY = height - h;
  if(secondScreen && externalDisplay){
    winX = (width * 2) - w - xOffset;
    console.log(winX,winY)
  }
  win.setPosition(winX,winY);
}
var loaded = false;
var path = require('path')
var iconpath = path.join(__dirname, 'extraResources', 'icon.png') // path of y
var serviceScript = path.join(__dirname, 'extraResources','service.js');

//Window stuff
var screenWidth;
var screenHeight;
var windowWidth = parseInt(cusW);
var windowHeight = parseInt(cusH);
const xOffset = 15;
var winX;
var winY;
function createWindow () {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  screenWidth = width;
  screenHeight = height;
  winX = width - windowWidth - xOffset;
  winY = height - windowHeight;
  // Create the browser window.
  win = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
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
  win.on('minimize',function(event){
      event.preventDefault();
      win.hide();
  });
  win.on('blur', function(event){
    if(!spotifyMiniPlayer || !spotifyAuthSuccess){
      win.webContents.send('slideOut')
      setTimeout(function(){
        win.hide();
      },500)
    }else{
      win.webContents.send('miniPlayer');
    }

  })
  win.on('show', function(event){
    if(spotifyAuthSuccess){
      getTrackInfo();
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
    }else{
      console.log("switching state to default")
      win.webContents.send("switchState","default");
    }
    win.webContents.focus();
  })
	globalShortcut.register('f7', function() {console.log('Showing console')
  win.webContents.openDevTools()})
  globalShortcut.register('f3', function() {getArtwork();})
  globalShortcut.register('f2', function() {skipTrack();})
  win.loadFile('index.html')
  // Open the DevTools.
  loaded = true;
  if(useSpotify){
    spotifyAuth(); //Get access code
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

//SPOTIFY STUFF HERE
const request = require('request')
var authWindow;
var accessCode;
var aToken, rToken;
var spotifyAuthSuccess = false;
var artist, trackName, album, albumArtURL, cTime, duration, isPlaying;
function getTokens(){
  fs.readFile("spotifyAuth.txt", "utf8", function(err, data) {
    //console.log("Spotify auth found: " + data);
    accessCode = data;
    request.post('https://accounts.spotify.com/api/token', {
      form: {
        "grant_type": "authorization_code",
        "code": accessCode,
        "redirect_uri": "https://github.com/"
      },
      headers: {'Authorization': "Basic ZWIwOTI5YzE5MDM1NGQ3ZWEwYjdlOGEwNjVhZDY4ZWQ6OWQ4NTRhMzY3OThhNGNlODljOTRiNmFlOWFlYjdmOTA="
    },
    json: true
    }, (error, res, body) => {
      if (error) {
        console.error(error)
        spotifyAuth();
        return
      }
      //console.log(`statusCode: ${res.statusCode}`)
      aToken = body["access_token"]
      rToken = body["refresh_token"]
      spotifyAuthSuccess = true;
      console.log("Authorization successful")
      getTrackInfo();
      //console.log(body)
      //console.log("Access Token: " + body["access_token"]) //Access TOKEN goodies
    })
  });
}

function spotifyAuth(){
  authWindow = new BrowserWindow({
    width: 500,
    height: 500,
	transparent: true,
	frame: true,
	x:0,
	y:0,
	alwaysOnTop:true,
	resizable:false,
    webPreferences: {
      nodeIntegration: true
    }
  })
  //Open spotify auth link, get access code
  var url = "https://accounts.spotify.com/en/authorize?response_type=code&client_id=eb0929c190354d7ea0b7e8a065ad68ed&scope=user-modify-playback-state%20user-read-currently-playing%20user-read-playback-state%20user-top-read&redirect_uri=https%3A%2F%2Fgithub.com%2F";
  authWindow.loadURL(url)
  authWindow.hide();
  var url = "";
  authWindow.on('page-title-updated', function(event, title){
    url = authWindow.webContents.getURL();
  })
  var i = setInterval(function(){
    var newURL = authWindow.webContents.getURL();
    if(!newURL.includes("spotify")){ //If auth is done
      clearInterval(i)
      accessCode = newURL.split("?")[1].substring(5)
      fs.writeFile('spotifyAuth.txt', accessCode, function(err){
        if (err) return console.log(err);
        authWindow.close()
        getTokens();
      });
    }else{
      authWindow.show();
    }
  },5000)
}

function pauseTrack(){
  console.log("Pausing Track");
  request.put('https://api.spotify.com/v1/me/player/pause', {
    headers: {'Authorization': "Bearer " + aToken},
  json: true
  }, (error, res, body) => {
    if (error) {
      console.error(error)
      return
    }
    console.log(`statusCode: ${res.statusCode}`)
    isPlaying = false;
  })
}

function resumeTrack(){
  request.put('https://api.spotify.com/v1/me/player/play', {
    headers: {'Authorization': "Bearer " + aToken},
  json: true
  }, (error, res, body) => {
    if (error) {
      console.error(error)
      return
    }
    console.log(`statusCode: ${res.statusCode}`)
    isPlaying = true;
  })
}

function skipTrack(){
  request.post('https://api.spotify.com/v1/me/player/next', {
    headers: {'Authorization': "Bearer " + aToken},
  json: true
  }, (error, res, body) => {
    if (error) {
      console.error(error)
      return
    }
    console.log(`statusCode: ${res.statusCode}`)
    setTimeout(getTrackInfo,1000)
  })
}

function previousTrack(){
  request.post('https://api.spotify.com/v1/me/player/previous', {
    headers: {'Authorization': "Bearer " + aToken},
  json: true
  }, (error, res, body) => {
    if (error) {
      console.error(error)
      return
    }
    console.log(`statusCode: ${res.statusCode}`)
    getTrackInfo();
  })
}

function playTrack(songName){
  var foundTrack; //Search for the artist
  request.get('https://api.spotify.com/v1/search/?q='+encodeURI(songName)+'&type=track', {
    headers: {'Authorization': "Bearer " + aToken},
  json: true
  }, (error, res, body) => {
    if (error) {
      console.error(error)
      return
    }
    console.log(`statusCode: ${res.statusCode}`)
    //console.log(body)
    if(body["tracks"]["items"].length > 0){
      foundTrack = body["tracks"]["items"]["0"]["uri"] //Play the first song
      request.post('https://api.spotify.com/v1/me/player/queue?uri='+foundTrack, {
        headers: {'Authorization': "Bearer " + aToken},
        json: true
        }, (error, res, body) => {
          if (error) {
            console.error(error)
            return
          }
          console.log(`statusCode: ${res.statusCode}`)
          //console.log(body);
          skipTrack();
        })
    }else{
      win.webContents.send("statusUpdate", "Couldn't find any matching songs. Sorry.")
    }
  })
}
var t=setInterval(checkSpotifyArt,15000);
async function getTrackInfo(){
  request.get('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: {'Authorization': "Bearer " + aToken},
  json: true
  }, (error, res, body) => {
    if (error) {
      console.error(error)
      return
    }
    console.log(`statusCode: ${res.statusCode}`)
    if(body != void(0)){
      //console.log(body["item"]["name"])
      artist = body["item"]["artists"][0]["name"];
      trackName = body["item"]["name"]
      album = body["item"]["album"]["name"]
      albumArtURL  = body["item"]["album"]["images"][0]["url"]
      cTime = body["progess_ms"];
      duration = body["item"]["duration_ms"];
      isPlaying = body["is_playing"];
      console.log(duration + " " + cTime)
      win.webContents.send('trackInfo', artist + ";" + trackName + ";" + album);
      //console.log(albumArtURL)
      win.webContents.send('artwork', albumArtURL)
      shouldUpdateTrack = false;
    }else{
      win.webContents.send('statusUpdate','No song playing');
    }
  })
}

var artworkURL;
var shouldUpdateTrack = true;
function checkSpotifyArt(){
  if(win.isVisible() && spotifyAuthSuccess){
    console.log("Checking for song change.")
    getTrackInfo();
  }else{
    shouldUpdateTrack = true;
  }
}

async function getLyrics(trackData){
  const lyrics = require('node-lyrics-api');
  let ourSong = await lyrics(trackName + " " + artist);
  if(ourSong.status.failed) return console.log('Bad Response');
  //console.log(ourSong.content[0].lyrics);
  //parentPort.postMessage("*" + ourSong.content[0].lyrics);
  win.webContents.send('lyrics',ourSong.content[0].lyrics)
}

app.whenReady().then(createWindow)

var currentMessage;

function readAnswers(message){ // Handle messages from service
  if(message.startsWith("!")){ //Read message from Arizona
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
    if(spotifyAuthSuccess){
        skipTrack();
    }else{
      win.webContents.send('statusUpdate','!Link your Spotify account to control your music!')
    }
  }else if(message.startsWith("previous")){
    if(spotifyAuthSuccess){
      previousTrack();
    }else{
      win.webContents.send('statusUpdate','!Link your Spotify account to control your music!')
    }
  }else if(message.startsWith("play")){
    if(spotifyAuthSuccess){
      message = message.substring(5);
      playTrack(message);
    }else{
      win.webContents.send('statusUpdate','!Link your Spotify account to control your music!')
    }
  }else{
    console.log(message);
  }
}

function showGoogle(query){
  var link = "https://www.google.com/search?q=" +query.replace("google","").replace(" ","+");
  require("electron").shell.openExternal(link);
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  win.show()
  win.webContents.focus();
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
  //win.webContents.send('slideIn', "Do it");
})

function readConfig(){
    let rawData = fs.readFileSync('config.json');
    console.log(rawData);
    let parsedData = JSON.parse(rawData);
    console.log(parsedData);
    return parsedData;
}

const { Worker, isMainThread } = require("worker_threads");

function runService(workerData) {
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

function showNotification(notif){
  //win.webContents.send('notification', notif);
}

async function run() {
  const result = runService({currentInput,inputs,responses});
}


const { ipcMain } = require('electron')
ipcMain.on('asynchronous-query', (event, arg) => { //When an input is given
	if(arg != ""){
		currentInput = arg;
		run();
	}

})
var state = "default";
ipcMain.on('synchronous-message', (event, arg) => {
  console.log(arg) // prints "ping"
  event.returnValue = 'Sync return';
})
ipcMain.on('switchSize', (event, arg) => {
  if(state == "default"){
    windowWidth = 450;
    windowHeight = 200;
    console.log("Switching to miniplayer: " + windowWidth + ", " + windowHeight)
    win.setSize(windowWidth, windowHeight)
    winX = screenWidth - windowWidth - 15;
    winY = screenHeight - windowHeight;
    win.setPosition(winX, winY - 200)
    if(!showTitleOnMiniPlayer){
      win.webContents.send("hideOutput");
    }else{
      win.webContents.send("showOutput");
    }
    state = "miniPlayer";
  }else{
    windowWidth = 450;
    windowHeight = 500;
    console.log("Switching to default: " + windowWidth + ", " + windowHeight)
    win.setSize(windowWidth, windowHeight)
    winX = screenWidth - windowWidth - 15;
    winY = screenHeight - windowHeight;
    win.setPosition(winX, winY)
    win.webContents.send("showOutput");
    state = "default";
  }
})
ipcMain.on('previousSong', (event, arg) => {
  if(spotifyAuthSuccess){
    previousTrack();
  }
})
ipcMain.on('nextSong', (event, arg) => {
  if(spotifyAuthSuccess){
    skipTrack();
  }
})
ipcMain.on('console', (event, arg) => {
  console.log(arg)
})
ipcMain.on('toggleMusic', (event, arg) => { //Check playback state then change it
  if(spotifyAuthSuccess){
    request.get('https://api.spotify.com/v1/me/player', {
      headers: {'Authorization': "Bearer " + aToken},
    json: true
    }, (error, res, body) => {
      if (error) {
        console.error(error)
        return
      }
      console.log(`statusCode: ${res.statusCode}`)
      if(body != void(0)){
        console.log(body["is_playing"])
        isPlaying = body["is_playing"];
        setTimeout(function(){
          win.webContents.send('updatePlaybackState', isPlaying)
          if(isPlaying){
            pauseTrack();
          }else{
            resumeTrack();
          }
        }, 500)
      }else{
        win.webContents.send('statusUpdate','No song playing');
      }
    })
  }
})
ipcMain.on('authMessage', (event, arg) => {
  console.log(arg) // prints "ping"
})
