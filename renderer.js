const animateCSS = (element, animation, prefix = 'animate__') =>
// We create a Promise and return it
new Promise((resolve, reject) => {
const animationName = `${prefix}${animation}`;
const node = document.querySelector(element);

node.classList.add(`${prefix}animated`, animationName);

var currentTrackTitle, currentTrackArtist, isPlaying = false;
var notifShowing = false;
var mainWindow = document.getElementById('mainWindow');
var textBox = document.getElementById('textBox');
var bgVideo = document.getElementById("bgVideo");
var notif = document.getElementById("notification");
var forceOutput = false;
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
  forceOutput = true;
  if(output.innerHTML.startsWith(currentTrackTitle)){
    isPlaying = true;
  }
  console.log(data);
  mainWindow.classList.remove("showingLyrics");
  showingLyrics = false;
  output.innerHTML = data;
  setTimeout(function(){
      forceOutput = false;
  }, 10000)
})
ipcRenderer.on('artwork', function(event, data){
  mainWindow.style.backgroundImage = "url('" + data + "')";
  mainWindow.classList.remove('colorBackground');
  mainWindow.classList.add('albumBackground');
  bgVideo.style.display = "none";
  //output.innerHTML = "Now playing: " + data + " by " + data;
})
ipcRenderer.on('trackInfo', function(event, data){
  var notifText = document.getElementById("notifText");
  currentTrackTitle = data.split(";")[1];
  currentTrackArtist = data.split(";")[0];
  if(!forceOutput){
    output.innerHTML = currentTrackTitle + " by " + currentTrackArtist;
  }
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
    notif.style.visibility = "hidden";
    notifShowing = true;
    //animateCSS("#notification", "slideInUp");
    setTimeout(function(){
      notif.style.visibility = "hidden";
      notifShowing = false;
    }, 5000)
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
var states = ["default", "miniPlayer", "configMenu"]
var currentState = "default";
var spotControls = document.getElementById("miniPlayerControls");
function switchState(state){
  if(state != currentState){
    console.log(state)
    switch(state){
        case states[0]: //Default state
          mainWindow.style.display = "none";
          animateCSS("#body","slideInUp")
          currentState = state;
          textBox.style.height = "25%";
          mainWindow.style.height = "75%";
          bgVideo.style.width = "125%";
          bgVideo.style.height = "125%";
          inputField.click();
          mainWindow.style.display = "flex";
          ipcRenderer.send("switchSize");
          break;
        case states[1]:
          currentState = state;
          textBox.style.height = "0px";
          mainWindow.style.height = "20%";
          bgVideo.style.width = "auto";
          bgVideo.style.height = "auto";
          ipcRenderer.send("switchSize")
          break;
        case states[2]:
          currentState = state;
          break;
        default:
          currentState = states[0];
    }
  }
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
  var button = document.getElementById("playbackButton");
  if(data == true){
    isPlaying = data;
    button.classList.remove("fa-pause");
    button.classList.add("fa-play-circle")
  }else{
    isPlaying = data;
    button.classList.add("fa-pause");
    button.classList.remove("fa-play-circle")
  }
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

animateCSS("#output", 'bounce');
animateCSS("#body", 'slideInUp');
