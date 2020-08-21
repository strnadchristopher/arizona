const { app, BrowserWindow, Menu, Tray, screen, net, nativeImage } = require('electron')
const electron = require('electron')
const globalShortcut = electron.globalShortcut
const fs = require("fs");
var execa = require("execa");
var currentInput;
var win;
const unhandled = require('electron-unhandled');
var dirPath = __dirname;

unhandled();
// Enable live reload for Electron too
require('electron-reload')(__dirname);
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
//READ Config
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
var loaded = false;
var path = require('path')
var iconpath = path.join(__dirname, 'extraResources', 'iconTiny.png') // path of y
var serviceScript = path.join(__dirname, 'extraResources','service.js');

//Window stuff
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
  win.on('minimize',function(event){
      event.preventDefault();
      win.hide();
  });
  win.on('blur', function(event){
    if(!spotifyMiniPlayer || !spotifyAuthSuccess || !isPlaying){
      appShowing = false;
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
      appShowing = true;
    }else{
      console.log("switching state to default")
      win.webContents.send("switchState","default");
    }
    win.webContents.focus();
  })
	globalShortcut.register('f7', function() {console.log('Showing console')
  win.webContents.openDevTools()})
  globalShortcut.register('f3', function() {getArtwork();})
  //globalShortcut.register('f2', function() {skipTrack();})
  globalShortcut.register('Ctrl+r', function() {win.webContents.send("switchState","configMenu");})
  globalShortcut.register('Ctrl+f5', function() {win.reload();})
  //win.webContents.send("switchState","default");
  win.loadFile('index.html')
  appShowing = true;
  // Open the DevTools.
  loaded = true;
  const { app, Menu, Tray } = require('electron')

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

  if(useSpotify){
    try {
      if (fs.existsSync(__dirname + "/spotifyAuth.txt")) {
        spotifyAuth();
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

//SPOTIFY STUFF HERE
const request = require('request')
var authWindow;
var accessCode;
var aToken, rToken;
var spotifyAuthSuccess = false;
var artist, trackName, album, albumArtURL, cTime, duration, isPlaying;

//Beginning of Spotify Auth Process, Opens a window to get approval
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
  var url = "https://accounts.spotify.com/en/authorize?response_type=code&client_id=eb0929c190354d7ea0b7e8a065ad68ed&scope=user-modify-playback-state%20user-read-currently-playing%20user-read-playback-state%20user-top-read&redirect_uri=https%3A%2F%2Fstrnadchristopher.github.io%2FarizonaPage%2F";
  authWindow.loadURL(url)
  var newURL = authWindow.webContents.getURL();
  if(!newURL.includes("spotify") && newURL != ""){}else{
    var i = setInterval(function(){
      newURL = authWindow.webContents.getURL();
      if(!newURL.includes("spotify") && newURL != ""){ //If auth is done
        console.log("finished");
        win.webContents.send("rendererLog","Finished")
        if(newURL.split("?")[1] != void(0)){
          clearInterval(i)
          accessCode = newURL.split("?")[1].substring(5)
          fs.writeFile(dirPath + '/spotifyAuth.txt', accessCode, function(err){
            if (err) return console.log(err);
            authWindow.close()
            getTokens();
          });
        }
      }else{
        authWindow.show();
      }
    },5000)
  }
}
//Get The Initial set of tokens, access and refreshToken
function getTokens(){
  console.log("Getting inital access token and refresh token");
  fs.readFile(dirPath + "/spotifyAuth.txt", "utf8", function(err, data) {
    //console.log("Spotify auth found: " + data);
    accessCode = data;
    request.post('https://accounts.spotify.com/api/token', {
      form: {
        "grant_type": "authorization_code",
        "code": accessCode,
        "redirect_uri": "https://strnadchristopher.github.io/arizonaPage/"
      },
      headers: {'Authorization': "Basic ZWIwOTI5YzE5MDM1NGQ3ZWEwYjdlOGEwNjVhZDY4ZWQ6OWQ4NTRhMzY3OThhNGNlODljOTRiNmFlOWFlYjdmOTA="
    },
    json: true
    }, (error, res, body) => {
      if (error) {
        console.log("Failed to get inital tokens.")
        win.webContents.send('statusUpdate', 'Failed to authorize Spotify. Please try again.')
        console.error(error)
        spotifyAuth();
        return
      }
      aToken = body["access_token"]
      rToken = body["refresh_token"]
      spotifyAuthSuccess = true;
      //win.webContents.send('statusUpdate', '')
      console.log("Authorization successful");
      win.webContents.send('statusUpdate', "Spotify Authorized");
      var t=setInterval(checkSpotifyArt,15000);
      checkSpotifyArt();
    })
  });
}
//Refresh the token if it's expired
function refreshToken(){
  console.log("Getting refresh token")
  request.post('https://accounts.spotify.com/api/token', {
    form: {
      "grant_type": "refresh_token",
      "code": rToken,
      "redirect_uri": "https://strnadchristopher.github.io/arizonaPage/"
    },
    headers: {'Authorization': "Basic ZWIwOTI5YzE5MDM1NGQ3ZWEwYjdlOGEwNjVhZDY4ZWQ6OWQ4NTRhMzY3OThhNGNlODljOTRiNmFlOWFlYjdmOTA="
  },
  json: true
  }, (error, res, body) => {
    if (error) {
      console.log("Failed to refresh token");
      console.error(error)
      spotifyAuth();
      return
    }
    aToken = body["access_token"]
    rToken = body["refresh_token"]
    spotifyAuthSuccess = true;
    console.log("Authorization successful")
    getTrackInfo();
  })
}
//Various spotify control functions
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
  console.log("Playing next song")
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
  console.log("Playing previous song");
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

async function getTrackInfo(){
  request.get('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: {'Authorization': "Bearer " + aToken},
  json: true
  }, (error, res, body) => {
    if (error) {
      console.log("Failed to get track info")
      //console.error(error)
      refreshToken();
      return false;
    }
    console.log(`statusCode: ${res.statusCode}`)
    if(body != void(0)){
      if(body["item"] != void(0)){
        artist = body["item"]["artists"][0]["name"];
        trackName = body["item"]["name"]
        album = body["item"]["album"]["name"]
        albumArtURL  = body["item"]["album"]["images"][0]["url"]
        cTime = body["progess_ms"];
        duration = body["item"]["duration_ms"];
        isPlaying = body["is_playing"];
        win.webContents.send('trackInfo', artist + ";" + trackName + ";" + album);
        if(!appShowing && spotifyMiniPlayer)
        {
          win.webContents.send("switchState","miniPlayer");
        }
        win.webContents.send('artwork', albumArtURL)
        shouldUpdateTrack = false;
      }
    }else{
      win.webContents.send('statusUpdate','No song playing');
    }
  })
}

var artworkURL;
var shouldUpdateTrack = true;
function checkSpotifyArt(){
  if(spotifyAuthSuccess && spotifyMiniPlayer){
    console.log("Checking for song change.");
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
  if(ourSong.content[0].lyrics != ""){
    win.webContents.send('lyrics',ourSong.content[0].lyrics)
  }else{
    win.webContents.send('statusUpdate',"Couldn't find lyrics.")
  }
}

app.whenReady().then(function(){
  setTimeout(createWindow, 2000)
}
)

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
      win.webContents.send('statusUpdate','Link your Spotify account to control your music')
    }
  }else if(message.startsWith("previous")){
    if(spotifyAuthSuccess){
      previousTrack();
    }else{
      win.webContents.send('statusUpdate','Link your Spotify account to control your music!')
    }
  }else if(message.startsWith("play")){
    if(spotifyAuthSuccess){
      message = message.substring(5);
      playTrack(message);
    }else{
      win.webContents.send('statusUpdate','Link your Spotify account to control your music!')
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
    //app.quit()
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

const { Worker, isMainThread } = require("worker_threads");
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
  console.log("Renderer: " + arg)
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
ipcMain.on('requestSpotifyAuth', (event, arg) => {
  spotifyAuth();
  console.log("Requesting Spotify Auth")
})
