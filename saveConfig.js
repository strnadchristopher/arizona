function saveConfigFile(jString){
  fs.writeFileSync(__dirname + '/config.json',jString);
}
