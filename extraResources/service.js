const { workerData, parentPort, isMainThread } = require("worker_threads");
var stringSimilarity = require('string-similarity');
var execa = require("execa")
const input = workerData['currentInput'];
const inputs = workerData['inputs'];
const responses = workerData['responses'];
var onMac = false;
if (process.platform == 'darwin') {
  onMac = true;
}
if(input != null){
  getAnswer();
}
function getAnswer(){
	var lowestString;
	var greatestDistance = 0;
	var currentPick;
	//var answer = stringSimilarity.compareTwoStrings("healed", "salad");
	//parentPort.postMessage(answer);
  if(input == "weather" ||
     input == "what's the weather"||
     input == "whats the forecast"){
    var weather = require('openweather-apis');
    weather.setLang('en');
    // English - en, Russian - ru, Italian - it, Spanish - es (or sp),
    // Ukrainian - uk (or ua), German - de, Portuguese - pt,Romanian - ro,
    // Polish - pl, Finnish - fi, Dutch - nl, French - fr, Bulgarian - bg,
    // Swedish - sv (or se), Chinese Tra - zh_tw, Chinese Sim - zh (or zh_cn),
    // Turkish - tr, Croatian - hr, Catalan - ca
    weather.setAPPID("b6f1f93b7b842bdf437126921aad0521");
    weather.setUnits('imperial');
    // set city by name
    weather.setCity('Houston');
    weather.getDescription(function(err, desc){
      // get the Temperature
        weather.getTemperature(function(err, temp){
            parentPort.postMessage("!" + desc + " and " + Math.round(temp) + " degrees.")
        });
    });
  }else if(input == "skip"||
           input == "next song" ||
           input == "next"){
						 if(onMac){
      nextTrack();
      parentPort.postMessage("!Playing next song.");
		}
  }else if(input == "lyrics"){
		if(onMac){
      parentPort.postMessage("!Finding lyrics...")
      getLyrics();
		}else{
			parentPort.postMessage("!Sorry, that only works on Mac right now.")
		}
  }else if(input == "options" ||
          input == "config"){
      parentPort.postMessage("options")
  }else if(input.startsWith("google") ||
           input.startsWith("what is")){
			parentPort.postMessage("google:" + input)
  }else if(input.endsWith(".py")){
    var python = require('child_process').spawn('python', ['scripts/'+input]);
    parentPort.postMessage("Running " + input)
    python.stdout.on('data',function(data){
        console.log("data: ",data.toString('utf8'));
    });
  }else{
    	for(var i in inputs){
    		var splitString = inputs[i].split("/");
    		for(var x in splitString){ //Each individual input string
    			var distance = stringSimilarity.compareTwoStrings(input, splitString[x]); //Check distance //SOMETHING GOES WRONG HERE
    			if(distance > greatestDistance){ // If its a match, or a better match than before
    				lowestString = splitString[x];
    				currentPick = i;
    				greatestDistance = distance;
    			}
    			parentPort.postMessage(input + " and " + splitString[x] + ", Distance: " + distance);
    		}
    	}
      var responsePick = responses[currentPick];
      var minimumConfidence = .5;
    	if(greatestDistance < minimumConfidence){ //Minimum confidence
        parentPort.postMessage("google:" + input)
    	}else{
  	    parentPort.postMessage("I think you said " + lowestString + ", Going with " + responsePick + " Distance: " + greatestDistance);
  	    parentPort.postMessage("!" + responsePick.split("/")[Math.floor(Math.random() * responsePick.split("/").length)]);
      }
  }
}
var scriptFiles = ["none"];
function readScripts(){
  const path = require('path')
  const fs  = require('fs')
  const directoryPath = path.join(__dirname, 'scripts');
  fs.readdir("scripts", function (err, files) {
  //handling error
  if (err) {
      parentPort.postMessage("!" + err)
      //return console.log('Unable to scan directory: ' + err);
  }
  //listing all files using forEach
  files.forEach(function (file) {
        scriptFiles.push(file);
    });
  });
  getAnswer();
}
function matchesScript(iString){
  scriptFiles.forEach(function(file){
    if (iString + ".py" == file){
      //parentPort.postMessage("!" + file);
        return file;
      }
  });
}
async function getLyrics(trackData){
  const lyrics = require('node-lyrics-api');
  const [artist, title] = await Promise.all([getArtist(), getTrackTitle()]);
  let ourSong = await lyrics(title + " " + artist);
  if(ourSong.status.failed) return console.log('Bad Response');
  console.log(ourSong.content[0].lyrics);
  parentPort.postMessage("*" + ourSong.content[0].lyrics);
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
async function nextTrack(){
  const {stdout} = await execa('osascript', ['-e',
  'tell application "Spotify" to next track']);
  console.log(stdout);
}
//Levenshtein
function levenshteinDistance (a, b){
	if(a.length == 0) return b.length;
	if(b.length == 0) return a.length;

	var matrix = [];

	// increment along the first column of each row
	var i;
	for(i = 0; i <= b.length; i++){
		matrix[i] = [i];
	}

	// increment each column in the first row
	var j;
	for(j = 0; j <= a.length; j++){
		matrix[0][j] = j;
	}

	// Fill in the rest of the matrix
	for(i = 1; i <= b.length; i++){
		for(j = 1; j <= a.length; j++){
		if(b.charAt(i-1) == a.charAt(j-1)){
			matrix[i][j] = matrix[i-1][j-1];
		} else {
			matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
									Math.min(matrix[i][j-1] + 1, // insertion
											matrix[i-1][j] + 1)); // deletion
		}
		}
	}

        return matrix[b.length][a.length];
};
