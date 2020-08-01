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
//console.log(ipcRenderer.sendSync('synchronous-message', 'ping')) // prints "pong"
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
  //output.innerHTML = "Now playing: " + data.split(";")[1] + " by " + data.split(";")[0];
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
/*
//Make Tray
var ICON_PATH = path.join(__dirname, 'extraResources', 'icon.png') // path of y
var path = require('path');
var remote = require('remote');
var Tray = remote.require('tray');
var Menu = remote.require('menu');
var NativeImage = remote.require('native-image');

var tray = null;

console.log('Setting tray...');
console.log('Device pixel ratio: ' + window.devicePixelRatio);
var menuTemplate = [{label: 'Hello world!'}]

var useDataUrl = location.search === '?useDataUrl';
if (useDataUrl) {
  tray = new Tray(
    NativeImage.createFromDataUrl(
      NativeImage.createFromPath(ICON_PATH).toDataUrl()
    )
  );
} else {
  tray = new Tray(
    NativeImage.createFromPath(ICON_PATH).toPNG()
  );
}
tray.setContextMenu(Menu.buildFromTemplate(menuTemplate));
*/
