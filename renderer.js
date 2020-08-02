const animateCSS = (element, animation, prefix = 'animate__') =>
// We create a Promise and return it
new Promise((resolve, reject) => {
const animationName = `${prefix}${animation}`;
const node = document.querySelector(element);

node.classList.add(`${prefix}animated`, animationName);

var notifShowing = false;
var mainWindow = document.getElementById('mainWindow');
// When the animation ends, we clean the classes and resolve the Promise
function handleAnimationEnd() {
  node.classList.remove(`${prefix}animated`, animationName);
  node.removeEventListener('animationend', handleAnimationEnd);

  resolve('Animation ended');
}
node.addEventListener('animationend', handleAnimationEnd);
});
const output = document.getElementById("output");
document.getElementById("mainWindow").addEventListener('click', function(){
  document.getElementById("inputField").focus();
})
var inputField = document.getElementById("inputField");
document.getElementById("inputField").focus();
const { ipcRenderer } = require('electron')
ipcRenderer.on('asynchronous-reply', (event, arg) => {
  console.log(arg)
  output.innerHTML = arg;
  animateCSS("#output", 'bounce');
})
ipcRenderer.on('statusUpdate', function(event, data){ //On New message
  console.log(data);
  mainWindow.classList.remove("showingLyrics");
  showingLyrics = false;
  output.innerHTML = data;
})
ipcRenderer.on('artwork', function(event, data){
  console.log(data);
  mainWindow.style.backgroundImage = "url('" + data + "')";
  mainWindow.classList.remove('colorBackground');
  mainWindow.classList.add('albumBackground');
  var bgVideo = document.getElementById("bgVideo")
  if(true){
    bgVid.style.visibility = "hidden";
  }
  //output.innerHTML = "Now playing: " + data + " by " + data;
})
ipcRenderer.on('trackInfo', function(event, data){
  console.log(data);
  var notif = document.getElementById("notification");
  var notifText = document.getElementById("notifText");
  notifText.innerHTML = data.split(";")[1] + " by " + data.split(";")[0];
  notif.style.visibility = "visible";
  notifShowing = true;
  //animateCSS("#notification", "slideInUp");
})
var showingLyrics = false;
ipcRenderer.on('lyrics', function(event, data){
  console.log(data);
  output.innerHTML = data;
  var mainWindow = document.getElementById('mainWindow');
  mainWindow.classList.add("showingLyrics")
  showingLyrics = true;
})
ipcRenderer.on('notification', function(event, data){
  console.log(data);
  var notif = document.getElementById("notification");
  var notifText = document.getElementById("notifText");
  notifText.innerHTML = data;
    notif.style.visibility = "visible";
    notifShowing = true;
    //animateCSS("#notification", "slideInUp");
    setTimeout(function(){
      notif.style.visibility = "hidden";
      notifShowing = false;
    }, 5000)
})
ipcRenderer.on('options', function(event, data){
  console.log(data);
  var cleanData = JSON.stringify(data);
  cleanData = cleanData.replace("{","").replace("}","").replace(",","\n");
  output.innerHTML = cleanData;
  mainWindow.classList.add("showingLyrics")
  showingLyrics = true;
})
ipcRenderer.on('focusInput', function(event, data){
  document.getElementById("inputField").focus();
  animateCSS("#body","slideInUp")
})
ipcRenderer.on('slideOut', function(event, data){
  animateCSS("#body","slideOutDown")
})
ipcRenderer.on('slideOut', function(event, data){
  animateCSS("#body","slideOutDown")
})

window.addEventListener("keyup", sendQuery, true);
function sendQuery(e){
if(e.keyCode == 13){
  if(inputField.value != ""){
    var send = inputField.value;
    inputField.value = "";
    output.value ="....";
    ipcRenderer.send('asynchronous-query', send);
    }
  }
}

//animateCSS("#output", 'bounce');
//animateCSS("#body", 'slideInUp');
window.onSpotifyWebPlaybackSDKReady = () => {
  ipcRenderer.send('authMessage', "fuck")
  authSpotify();
};

function authSpotify(){
  const play = ({
    spotify_uri,
    playerInstance: {
      _options: {
        getOAuthToken,
        id
      }
    }
  }) => {
    getOAuthToken(access_token => {
      fetch(`https://api.spotify.com/v1/me/player/play?device_id=${id}`, {
        method: 'PUT',
        body: JSON.stringify({ uris: [spotify_uri] }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        },
      });
    });
  };

  play({
    playerInstance: new Spotify.Player({ name: "Arizona" }),
    spotify_uri: 'spotify:track:7xGfFoTpQ2E7fRF5lN10tr',
  });
  ipcRenderer.send('authMessage', "WAAA")
}
