const { app, BrowserWindow, Menu, Tray, screen, net, nativeImage } = require('electron')
//SPOTIFY STUFF HERE
const fs = require('fs')
const request = require('request')
var authWindow;
var accessCode;
var aToken, rToken;
var spotifyAuthSuccess = false;
var artist, trackName, album, albumArtURL, cTime, duration, isPlaying;
var dirPath = __dirname;
exports.aToken = function(){
  return aToken;
}
exports.rToken = function(){
  return rToken;
}
exports.authorized = function(){
  return spotifyAuthSuccess;
}
exports.artist = function(){
  return artist;
}
exports.trackName = function(){
  return trackName;
}
exports.album = function(){
  return album;
}
exports.albumArtURL = function(){
  return album;
}
exports.cTime = function(){
  return cTime;
}
exports.duration = function(){
  return duration;
}
exports.isPlaying = function(){
  return isPlaying;
}

//Beginning of Spotify Auth Process, Opens a window to get approval
exports.authorize = function(callback){
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

  authWindow.on('close', function(event){
    event.preventDefault();
    authWindow.hide()
  })

  //Open spotify auth link, get access code
  var url = "https://accounts.spotify.com/en/authorize?response_type=code&client_id=eb0929c190354d7ea0b7e8a065ad68ed&scope=user-modify-playback-state%20user-read-currently-playing%20user-read-playback-state%20user-top-read&redirect_uri=https%3A%2F%2Fstrnadchristopher.github.io%2FarizonaPage%2F";
  authWindow.loadURL(url)
  var newURL = authWindow.webContents.getURL();
  if(!newURL.includes("spotify") && newURL != ""){}else{
    var i = setInterval(function(){
      if(!authWindow.isVisible()){
        clearInterval(i)
      }else{
        newURL = authWindow.webContents.getURL();
        if(!newURL.includes("spotify") && newURL != ""){ //If auth is done
          console.log("finished");
          if(newURL.split("?")[1] != void(0)){
            clearInterval(i)
            accessCode = newURL.split("?")[1].substring(5)
            fs.writeFile(dirPath + '/spotifyAuth.txt', accessCode, function(err){
              if (err) return console.log(err);
              authWindow.close()
              getTokens(callback)
            });
          }
        }else{
          authWindow.show();
        }
      }
    },5000)
  }
}
//Get The Initial set of tokens, access and refreshToken
function getTokens(callback){
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
        return false;
        console.error(error)
      }
      aToken = body["access_token"]
      rToken = body["refresh_token"]
      spotifyAuthSuccess = true;
      console.log("Authorization successful");
      callback()
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
  })
}
//Various spotify control functions
exports.pause = function(){
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

exports.resume = function(){
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

exports.skip = function(callback){
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
    callback()
  })
}

exports.previous = function(callback){
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
    callback()
  })
}

exports.play = function(songName){
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
    console.log(body);
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
          console.log(body);
          console.log(`statusCode: ${res.statusCode}`)
          //console.log(body);
          return skipTrack();
        })
    }else{
      return false;
    }
  })
}

exports.toggleMusic = function(){ //Check playback state then change it
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
          if(isPlaying){
            exports.pause();
          }else{
            exports.resume();
          }
        }, 500)
      }else{
        return false;
      }
    })
  }
}

exports.getTrackInfo = async function(callback){
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
        callback(artist + ";" + trackName + ";" + album + ";" + albumArtURL);
        shouldUpdateTrack = false;
      }
    }else{
      return false;
    }
  })
}
