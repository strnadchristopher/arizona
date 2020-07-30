const animateCSS = (element, animation, prefix = 'animate__') =>
// We create a Promise and return it
new Promise((resolve, reject) => {
const animationName = `${prefix}${animation}`;
const node = document.querySelector(element);

node.classList.add(`${prefix}animated`, animationName);

var notifShowing = false;

// When the animation ends, we clean the classes and resolve the Promise
function handleAnimationEnd() {
  node.classList.remove(`${prefix}animated`, animationName);
  node.removeEventListener('animationend', handleAnimationEnd);

  resolve('Animation ended');
}

node.addEventListener('animationend', handleAnimationEnd);
});
const output = document.getElementById("output");
document.getElementById("sectionA").addEventListener('click', function(){
  document.getElementById("inputField").focus();
})
var inputField = document.getElementById("inputField");
document.getElementById("inputField").focus();
const { ipcRenderer } = require('electron')
//console.log(ipcRenderer.sendSync('synchronous-message', 'ping')) // prints "pong"

ipcRenderer.on('asynchronous-reply', (event, arg) => {
  console.log(arg) // prints "pong"

  output.innerHTML = arg;
  animateCSS("#output", 'bounce');
  //document.write(arg);
})

ipcRenderer.on('statusUpdate', function(event, data){
  console.log(data);
  output.innerHTML = data;
})
ipcRenderer.on('artwork', function(event, data){
  console.log(data);
  var sectionA = document.getElementById('sectionA');
  sectionA.style.backgroundImage = "url('" + data + "')";
  sectionA.classList.remove('colorBackground');
  sectionA.classList.add('albumBackground');
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
  var sectionA = document.getElementById('sectionA');
  sectionA.classList.add("showingLyrics")
  showingLyrics = true;
  //output.innerHTML = "Now playing: " + data.split(";")[1] + " by " + data.split(";")[0];
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

    }, 5000)
  //output.innerHTML = "Now playing: " + data.split(";")[1] + " by " + data.split(";")[0];
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
