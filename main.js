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
var username, assistantName, assistantShortcut, theme, cusW, cusH, secondScreen;
//READ Config
function loadConfig(){
  var initConfig = readConfig();
  username = initConfig["username"];
  assistantName = initConfig["assistantName"]
  assistantShortcut = initConfig["assistantShortcut"]
  cusW = initConfig["windowWidth"];
  cusH = initConfig["windowHeight"];
  secondScreen = (initConfig["secondScreen"] === 'true')
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

function createWindow () {
  var windowWidth = parseInt(cusW);
  var windowHeight = parseInt(cusH);
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const xOffset = 15;
  const winX = width - windowWidth - xOffset;
  const winY = height - windowHeight;
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
    //event.preventDefault();
    win.webContents.send('slideOut')
    setTimeout(function(){
      win.hide();
    },500)
    //win.hide()
  })
  win.on('show', function(event){
    //win.hid()
    //createWindow()
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
    win.show();
    win.webContents.send('focusInput', 'Swag');
  })
	globalShortcut.register('f5', function() {console.log('App Refreshed')
  win.reload()})
	globalShortcut.register('f7', function() {console.log('Showing console')
  win.webContents.openDevTools()})
  globalShortcut.register('f3', function() {getArtwork();})
  //globalShortcut.register('f2', function() {skipTrack();})
  win.loadFile('index.html')
  // Open the DevTools.
  loaded = true;
  if(!fs.existsSync("spotifyAuth.txt")){
    spotifyAuth();
  }
}

function testAuth(){
  var SpotifyWebApi = require('spotify-web-api-node');
  var scopes = ['streaming','user-read-private', 'user-read-email'],
  redirectUri = 'https://www.google.com/',
  clientId = 'eb0929c190354d7ea0b7e8a065ad68ed',
  state = 'some-state-of-my-choice';

// Setting credentials can be done in the wrapper's constructor, or using the API object's setters.
var spotifyApi = new SpotifyWebApi({
  redirectUri: redirectUri,
  clientId: clientId
});

// Create the authorization URL from secret and such
var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);

// https://accounts.spotify.com:443/authorize?client_id=5fe01282e44241328a84e7c5cc169165&response_type=code&redirect_uri=https://example.com/callback&scope=user-read-private%20user-read-email&state=some-state-of-my-choice
console.log(authorizeURL);
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
authWindow.loadURL(authorizeURL)
authWindow.show();

var url;
url = authWindow.webContents.getURL();
console.log(url)
authWindow.on('page-title-updated', function(event, title){
  url = authWindow.webContents.getURL();
  console.log(url)
})
setTimeout(function(){
  var newURL = authWindow.webContents.getURL();
  accessCode = newURL.split("?")[1].substring(5)
  accessCode = accessCode.split("&")[0]
  console.log(accessCode);
  var code = accessCode;
  //code = "BQDIocZszcIMa5UFIkMgXFnyZ5iJA-u6SIhMik-io6zEDBcSHp1FNjhFo_VpLKxin72Ds-FnS7NS6mgo5AkTjTfNMzccnRRb9QyeCRCQtQ44i5FgyrBufGYF0aaJzYhZZ3frtsPLfXQmYmXzUMXcPN0ZyeDP9ieS6vViow";
  //fs.writeFile('spotifyAuth.txt', accessCode, function(err){
    //if (err) return console.log(err);
  //});
  spotifyApi.authorizationCodeGrant(code).then(
  function(data) {
    console.log('The token expires in ' + data.body['expires_in']);
    console.log('The access token is ' + data.body['access_token']);
    console.log('The refresh token is ' + data.body['refresh_token']);

    // Set the access token on the API object to use it in later calls
    spotifyApi.setAccessToken(data.body['access_token']);
    spotifyApi.setRefreshToken(data.body['refresh_token']);
  },
  function(err) {
    console.log('Something went wrong!', err);
  }
);
}, 5000)
}
function skipTrack(){
  var SpotifyWebApi = require('spotify-web-api-node');
  fs.readFile("spotifyAuth.txt", "utf8", function(err,data){
      accessCode = data;
      console.log("a code: " + accessCode)
      var spotifyApi = new SpotifyWebApi(credentials);
      // Retrieve an access token.

      // Do search using the access token
      spotifyApi.getMyCurrentPlaybackState({
  })
  .then(function(data) {
    // Output items
    console.log("Now Playing: ",data.body);
  }, function(err) {
    console.log('Something went wrong!', err);
  });
      /*
      spotifyApi.authorizationCodeGrant(accessCode).then(
      function(data) {
        console.log('The token expires in ' + data.body['expires_in']);
        console.log('The access token is ' + data.body['access_token']);
        console.log('The refresh token is ' + data.body['refresh_token']);
        // Set the access token on the API object to use it in later calls
        spotifyApi.setAccessToken(data.body['access_token']);
        spotifyApi.setRefreshToken(data.body['refresh_token']);
      },
      function(err) {
        console.log('Something went wrong!', err);
      })
      fs.writeFile('spotifyAuth.txt', accessCode, function(err){
        if (err) return console.log(err);
      });

      spotifyApi.getMyCurrentPlaybackState({
      })
      .then(function(data) {
        // Output items
        console.log("Now Playing: ",data.body);
      }, function(err) {
        console.log('Something went wrong!', err);
      });
      */
      })

}

var authWindow;
var accessCode;

function getAuth(){

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
  //Open spotify auth link
  authWindow.loadURL("https://accounts.spotify.com/en/authorize?response_type=code&client_id=eb0929c190354d7ea0b7e8a065ad68ed&scopes=streaming&redirect_uri=https%3A%2F%2Fgithub.com%2F")
  authWindow.show();
  var url;
  authWindow.on('page-title-updated', function(event, title){
    url = authWindow.webContents.getURL();
    console.log(url)
  })
  setTimeout(function(){
    var newURL = authWindow.webContents.getURL();
    accessCode = newURL.split("?")[1].substring(5)
    authWindow.close()
    console.log(accessCode);
    /*
    fs.writeFile('spotifyAuth.txt', accessCode, function(err){
      if (err) return console.log(err);
    });
    */
    var aToken, rToken;
    const request = require('request')
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
        return
      }
      console.log(`statusCode: ${res.statusCode}`)
      aToken = body["access_token"]
      rToken = body["refresh_token"]
      console.log("Access Token: " + body["access_token"]) //Access TOKEN goodies


      var testAuth = "Bearer " + aToken;
      //Test spotify
      request.get("https://api.spotify.com/v1/artists/5PbpKlxQE0Ktl5lcNABoFf",{
        headers: {"Authorization": testAuth},
        json: true,
      },(error, res, body) => {
        if (error) {
          console.error(error)
          return
        }
        console.log(`statusCode: ${res.statusCode}`)
        console.log(body)
        win.webContents.send("artwork", body["images"][0]["url"])
      })
    })



  }, 5000)
}

app.whenReady().then(createWindow)

var currentMessage;

function readAnswers(message){ // Handle messages from service
  if(message.startsWith("!")){
    currentMessage = message.substring(1,message.length);
    //speak(currentMessage);
    currentMessage = currentMessage.replace("%username%", username);
    console.log(currentMessage);
    win.webContents.send('statusUpdate', currentMessage);
  }else if(message.startsWith("*")){
    currentMessage = message.substring(1,message.length);
    win.webContents.send('notification', "Lyrics found");
    win.webContents.send('lyrics', currentMessage);
  }else if(message == "options"){
    var configSave = readConfig();
    win.webContents.send('options', configSave);
  }else if(message.startsWith("google")){
    var search = message.split(":")[1];
    showGoogle(search);
  }else{
    console.log(message);
  }
}

function showGoogle(query){
  var link = "https://www.google.com/search?q=" +query.replace("google","").replace(" ","+");
  require("electron").shell.openExternal(link);
}
var artworkURL;
var spotifyUpdateInterval = 3; //In seconds

function checkSpotifyArt(){
  getArtwork();
}

async function getArtwork(){
  const {stdout} = await execa('osascript', ['-e',
  'tell application "Spotify" to return current track\'s artwork url']);
  if(stdout != artworkURL){
    artworkURL = stdout;
    win.webContents.send('artwork', stdout);
    showNotification("Now Playing");
    getTrackInfo();
  }
}

async function getTrackInfo(){
  const [artist, title] = await Promise.all([getArtist(), getTrackTitle()]);
    win.webContents.send('trackInfo', artist + ";" + title);
}
async function getArtist(){
  const {stdout} = await execa('osascript', ['-e',
  'tell application "Spotify" to return current track\'s artist']);
  //console.log(art);
  return stdout;
}
async function getTrackTitle(){
  const {stdout} = await execa('osascript', ['-e',
  'tell application "Spotify" to return current track\'s name']);
  return stdout;
}
var onMac = false;
if (process.platform == 'darwin') {
  onMac = true;
}
if(onMac){
  var t=setInterval(checkSpotifyArt,spotifyUpdateInterval * 1000);
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
  win.webContents.send('notification', notif);
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

ipcMain.on('synchronous-message', (event, arg) => {
  console.log(arg) // prints "ping"
  event.returnValue = 'Sync return';
})

ipcMain.on('authMessage', (event, arg) => {
  console.log(arg) // prints "ping"
})
