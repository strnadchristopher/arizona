Arizona
======

Arizona is a fully customizable personal assistant and Spotify miniplayer. It'll help you google stuff. It's the best.

![Picture of Arizona](https://github.com/strnadchristopher/arizona/blob/master/preview.gif?raw=true)

## Official Beta Release

Arizona is now in open beta! Get the latest release for Windows or Mac at https://github.com/strnadchristopher/arizona/releases/tag/v1.0.0-beta

## SPOTIFY UPDATE

Spotify support is being added in version 0.0.11! If "spotifyMiniPlayer" is set to true in your config, an authorization window will pop up. And it should be as simple as any other oAuth situation.

REQUIRES SPOTIFY PREMIUM ACCOUNT

### New Commands
* 'play [song name]' - play any song from spotify
* 'skip', 'next song' - skip song
* 'previous' - previous song
* 'lyrics' - display song lyrics from node-lyrics-api

## Spotify Mini Player

If enabled, instead of the app closing when you click away, it will turn into a miniplayer.

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

### Installing

* Node js

* Clone this repository or install with
```
npm install arizona
```


* Install Dependencies by running the following command in the arizona directory
```
npm install
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

### All Platforms
* 'google [query]'' - open google in your browser with your query, faster than cortana (example: "google the shaggy dog")
* Any message that doesn't look like an input from the "inputs" file will be googled. So you can type "gene wilder" and it will google Gene Wilder
* 'weather' - display the weather

## Shortcuts

* Ctrl+Q - Pull up assistant

## TO-DO

* Voice Control and Response (considering using AWS)

## Authors

Christopher Strnad
strnadchristopher@gmail.com

## License

This project is licensed under the GNU General Public License - see the LICENSE.md file for details
