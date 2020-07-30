const { workerData, parentPort, isMainThread } = require("worker_threads");
var stringSimilarity = require('string-similarity');
var execa = require("execa")

//parentPort.postMessage(workerData['inputs']);
const input = workerData['currentInput'];
const inputs = workerData['inputs'];
const responses = workerData['responses'];
// You can do any heavy stuff here, in a synchronous way
// without blocking the "main thread"
parentPort.on("message", message => { //On thread getting a message
  if (message === "exit") {
    parentPort.postMessage("sold!");
    //parentPort.close();
  } else { // Where the input is sent
	  //var answer = getAnswer(workerData);
	  //parentPort.postMessage(answer);
	parentPort.postMessage("yo");
  }
});
if(input != null){
	getAnswer();
}else{
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

//parentPort.postMessage("hdelp");
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
      nextTrack();
      parentPort.postMessage("!Playing next song.");
  }else if(input == "lyrics"){
      parentPort.postMessage("!Finding lyrics...")
      getLyrics();
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
  			if(greatestDistance < 0){
  				//event.reply('asynchronous-reply', responses[currentPick]);
  			}
  		}
  	}
    var responsePick = responses[currentPick];
  	if(greatestDistance == 0){
  		responsePick = "Sorry I think I just had a stroke, say that again?/Uh, sorry I like totally just spaced out./I literally have no idea what you just said.";
  	}
  	parentPort.postMessage("I think you said " + lowestString + ", Going with " + responsePick);
  	parentPort.postMessage("!" + responsePick.split("/")[Math.floor(Math.random() * responsePick.split("/").length)]);
  }
}

async function getLyrics(trackData){
  const lyrics = require('node-lyrics-api');

  const [artist, title] = await Promise.all([getArtist(), getTrackTitle()]);


  let ourSong = await lyrics(title + " " + artist);

  if(ourSong.status.failed) return console.log('Bad Response');

  console.log(ourSong.content[0].lyrics);

  parentPort.postMessage("*" + ourSong.content[0].lyrics);
  //lyrics('our song').then(l => console.log(l.content[0].lyrics));
  //win.webContents.send('lyrics', ourSong.content[0].lyrics);
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
