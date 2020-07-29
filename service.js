const { workerData, parentPort, isMainThread } = require("worker_threads");
var stringSimilarity = require('string-similarity');


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
	if(greatestDistance == 10){
		//return "error";
	}
	parentPort.postMessage("I think you said " + lowestString + ", Going with " + responses[currentPick]);
	parentPort.postMessage("!" + responses[currentPick].split("/")[Math.floor(Math.random() * responses[currentPick].split("/").length)]);
}
