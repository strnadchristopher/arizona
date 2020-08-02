Arizona
======

Arizona is a fully customizable personal assistant with weather and Spotify integration. It'll help you google stuff. It's the best.

![Picture of Arizona](https://github.com/strnadchristopher/arizona/blob/master/preview.png?raw=true)

## Official Discord

https://discord.gg/6VcgEUR
Stop by and offer bug reports or suggestions. 

## Description

Arizona is meant to be a customizable open replacement for desktop assistants like Cortana and Siri. You can use any mp4 as your assistant's avatar. It's meant to be completely customizable to your liking, and because it's all written in HTML and CSS, that's completely easy.

## New Features

### Themes
Create a folder in the themes directory with the name of your theme and add a file named "style.css" then, in config.json, set your theme to the name of the folder you created.
You can add whatever css you want to the custom css file.

### Background Video
Place a mp4 in the directory of your theme with the name 'bg.mp4'. Then just makes sure "backgroundVideo" is set to true in config.json

### Python Scripts
Run Python scripts by placing them in your 'scripts' folder and just type the name of the python file to run. (Must have python installed)

## Getting Started

### Dependencies

* Node js
* Install Dependencies by running the following command in the arizona directory
```
npm install
```

### Installing

* Clone this repository or install with
```
npm install arizona
```

### Executing program

* Run this command in the arizona directory
```
npm start
```

## Customizing
See Config.json to change settings like your name, your assistant's name, and more.
To Add or remove inputs for conversation, edit the 'inputs.txt' and 'responses.txt'
Every line in 'inputs.txt' corresponds to the same line in 'responses.txt'. Separate alternate versions of inputs or responses with a '/'

## Commands
### Mac OS with Spotify only
* 'next', 'skip', 'next song' - skip track on spotify
* 'lyrics' - display song lyrics from node-lyrics-api

### All Platforms
* 'google [query]'' - open google in your browser with your query, faster than cortana (example: "google the shaggy dog")
* Any message that doesn't look like an input from the "inputs" file will be googled. So you can type "gene wilder" and it will google Gene Wilder
* 'weather' - display the weather

## Shortcuts

* Ctrl+Q - Pull up assistant

* Escape - Hide assistant

* F5 - Refresh Assistant

## TO-DO

* Voice Control and Response (considering using AWS)
* Spotify API and more music programs

## Known Bugs
* (macOS A) When window is re-opened from being hidden, a strange shadow appears behind the app that doesn't go away.
* (Windows) Tray icon doesn't appear.

## Authors

Christopher Strnad
strnadchristopher@gmail.com

## License

This project is licensed under the GNU General Public License - see the LICENSE.md file for details
