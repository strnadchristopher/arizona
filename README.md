Check out the github here: https://github.com/strnadchristopher/arizona

Arizona is a fully customizable personal assistant with weather and Spotify integration*. It'll help you google stuff. It's the best.

Usage:
See Config.json to change things like your name and colors
To Add or remove inputs for conversation, edit the 'inputs.txt' and 'responses.txt'
Every line in 'inputs.txt' corresponds to the same line in 'responses.txt'. Separate alternate versions of inputs or responses with a '/'

Custom CSS:
Create a folder in the themes directory with the name of your theme and add a file named "style.css" then, in config.json, set your theme to the name of the folder you created.
You can add whatever css you want to the custom css file.

Commands:
Mac OS with Spotify only:
"next", "skip", "next song" - skip track on spotify
"lyrics" - display song lyrics from node-lyrics-api

All:
google [query] - open google in your browser with your query, faster than cortana (example: "google the shaggy dog")

weather - display the weather

Shortcuts:

Shift-Ctrl-A - Pull up assistant

Escape - Hide assistant

F5 - Refresh Assistant

TODO:

Voice Control and Response
Ability to add python scripts to commands

Known Bugs:
(macOS only) When window is re-opened from being hidden, a strange shadow appears behind the app that doesn't go away.
Tray icon doesn't appear on windows.

*only available on macOS currently.
