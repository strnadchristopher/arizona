const fs = require('fs');
var loadConfig = function loadConfig(){
    let rawData = fs.readFileSync(__dirname + '/config.json');
    console.log(rawData);
    let parsedData = JSON.parse(rawData);
    console.log(parsedData);
    return parsedData;
}
module.exports.config = loadConfig;
