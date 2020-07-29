# node-aseprite

Node.js implementation of Aseprite file format parsing using Kaitai struct definitions.

## Installation

```console
$ npm install --save aseprite
```

## Usage

```javascript
const Aseprite = require('aseprite');

const fs = require('fs');
const contents = fs.readFileSync('my-sprite.ase');

const ase = Aseprite.parse(contents, {
	clean: true // default; set to false if you want to retain buffer information
	inflate: true // default; set to false if you want to skip Zlib inflation
});

// If you didn't clean before, you can manually do so:
const cleanedAse = Aseprite.clean(ase);

// If you didn't inflate before, you can manually do so:
const inflatedAse = Aseprite.inflate(ase);

// Dump it to the console
console.log(require('util').inspect(cleanAse, {depth: null, colors: true}));
```

# License
Copyright &copy; 2020, Wavetilt LLC. Released under the [MIT License](LICENSE).
