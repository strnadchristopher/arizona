const animateCSS = (element, animation, prefix = 'animate__') =>
// We create a Promise and return it
new Promise((resolve, reject) => {
const animationName = `${prefix}${animation}`;
const node = document.querySelector(element);

node.classList.add(`${prefix}animated`, animationName);

var currentTrackTitle, currentTrackArtist, isPlaying = false;
var mainWindow = document.getElementById('mainWindow');
var textBox = document.getElementById('textBox');
var bgVideo = document.getElementById("bgVideo");
// When the animation ends, we clean the classes and resolve the Promise
function handleAnimationEnd() {
  node.classList.remove(`${prefix}animated`, animationName);
  node.removeEventListener('animationend', handleAnimationEnd);
  resolve('Animation ended');
}
node.addEventListener('animationend', handleAnimationEnd);
});
const output = document.getElementById("output");

var inputField = document.getElementById("inputField");
//document.getElementById("inputField").focus();
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
  mainWindow.style.backgroundImage = "url('" + data + "')";
  mainWindow.classList.remove('colorBackground');
  mainWindow.classList.add('albumBackground');
  bgVideo.style.display = "none";
})
ipcRenderer.on('trackInfo', function(event, data){
  currentTrackTitle = data.split(";")[1];
  currentTrackArtist = data.split(";")[0];
  output.innerHTML = currentTrackTitle + " by " + currentTrackArtist;
})
ipcRenderer.on('rendererLog', function(event, data){
  console.log(data)
})
var showingLyrics = false;
ipcRenderer.on('lyrics', function(event, data){
  console.log(data);
  output.innerHTML = data;
  var mainWindow = document.getElementById('mainWindow');
  mainWindow.classList.add("showingLyrics")
  showingLyrics = true;
})
var miniMode = false;
ipcRenderer.on('miniPlayer', function(event, data){
  switchState('miniPlayer');
})
ipcRenderer.on('switchState', function(event, data){
  switchState(data);
})
ipcRenderer.on('hideOutput', function(event, data){
  output.style.display = "none";
})
ipcRenderer.on('showOutput', function(event, data){
  output.style.display = "flex";
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
  setTimeout(function(){
    inputField.click();
  },2000)
  animateCSS("#body","slideInUp")
})
ipcRenderer.on('slideOut', function(event, data){
  animateCSS("#body","slideOutDown")
})
ipcRenderer.on("hideControls", function(event, data){
  spotControls.parentNode.removeChild(spotControls);
})
ipcRenderer.on('updatePlaybackState', function(event, data){
  var button = document.getElementById("toggleButton");
  if(data == true){
    isPlaying = data;
    button.src = "play.png";
  }else{
    isPlaying = data;
    button.src = "pause.png";
  }
})
var states = ["default", "miniPlayer", "configMenu"]
var currentState = "default";
var configMenu = document.getElementById("configMenu");
var spotControls = document.getElementById("miniPlayerControls");
function switchState(state){
  if(state != currentState){
    console.log(state)
    switch(state){
        case states[0]: //Default state
          currentState = state;
          textBox.style.display = "flex";
          textBox.style.height = "25%";
          mainWindow.style.height = "75%";
          mainWindow.style.marginTop = "50px";
          bgVideo.style.width = "125%";
          bgVideo.style.height = "125%";
          inputField.click();
          output.style.display = "block";
          configMenu.style.display = "none";
          ipcRenderer.send("updateState", "default");
          if(spotControls != null){
            spotControls.style.display = "flex";
          }
          break;
        case states[1]: // Miniplayer state
          currentState = state;
          textBox.style.height = "0px";
          textBox.style.display = "none";
          mainWindow.style.height = "80%";
          mainWindow.style.marginTop = "auto";
          mainWindow.style.marginBottom = "0";
          configMenu.style.display = "none";
          bgVideo.style.width = "auto";
          bgVideo.style.height = "auto";
          ipcRenderer.send("updateState", "miniplayer");
          if(spotControls != null){
            spotControls.style.display = "flex";
          }
          break;
        case states[2]: // Config
          currentState = state;
          textBox.style.height = "0px";
          mainWindow.style.height = "90%";
          output.style.display = "none";
          configMenu.style.display = "block";
          configMenu.style.overflowY = "scroll";
          bgVideo.style.width = "auto";
          bgVideo.style.height = "auto";
          if(spotControls != null){
            spotControls.style.display = "none";
          }
          ipcRenderer.send("updateState", "default");
          populateConfigMenu();
          break;
        default:
          currentState = states[0];
    }
  }
}
var username, assistantName, assistantShortcut, theme, cusW, cusH, secondScreen, useSpotify, spotifyMiniPlayer, showTitleOnMiniPlayer;
//READ Config
var configLoad = require("./loadConfig.js");
function getPath(){
  return __dirname;
}
var config;
function populateConfigMenu(){
  config = configLoad.config();
  var configForm = document.getElementById("configForm");
  var configString = "";
  var values = Object.values(config);
  var keys = Object.keys(config);
  configString += "<button class='spotifyAuthButton' onclick='requestSpotifyAuth(event)'>Link Spotify</button><br/>"
  for(var i = 0; i < values.length; i++){
    configString += "<span class='configItem'>" + keys[i] + " : <input name='" + keys[i] + "' class='configInput' type='text' value='" + values[i] + "'></span><br/>";
  }
  configString += "<button method='post' onclick='saveConfig(event)'>Save</button>"
  ipcRenderer.send('console',configString);
  configForm.innerHTML = configString;
}
function saveConfig(event){
  event.preventDefault();
  var form = document.getElementById("configForm");
  var fields = form.getElementsByTagName("input");
  var objects = [];
  var jString = '{\n';
  for(var i=0;i<fields.length;i++){
    jString += '"' + fields[i].getAttribute("name") + '" : "' + fields[i].value + '",\n';
  }
  jString = jString.substring(0,jString.length - 2);
  jString += '\n}';
  //var configSave = require("./saveConfig.js")(jString);
  saveConfigFile(jString);
  //configSave.saveConfig(jString);
  ipcRenderer.send('console',jString)
  switchState("default")
}
function requestSpotifyAuth(event){
  event.preventDefault();
  ipcRenderer.send('requestSpotifyAuth')
  //switchState("default");
}
function toggleMusic(){
  ipcRenderer.send("toggleMusic");
}
function nextTrack(){
  ipcRenderer.send("nextSong");
}
function previousTrack(){
  ipcRenderer.send("previousSong");
}
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

animateCSS("#output", 'bounce');
animateCSS("#body", 'slideInUp');
