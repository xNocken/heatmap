const fs = require('fs');
const heatmap = require('../index.js');
const locations = JSON.parse(fs.readFileSync('./locations.json').toString());

const getMapPos = (vector3, scaleFactor = 1) => ({
  x: ((135000 + (vector3.y)) / 270000) * scaleFactor,
  y: ((270000 - (135000 + (vector3.x))) / 270000) * scaleFactor,
});

heatmap({
  positions: locations.map((location) => getMapPos(location, 2048)),
  width: 2048,
  height: 2048,
  backgroundPath: './map-16.40.png',
  squareSize: 5,
  radius: 50,
}).then((canvas) => {
  fs.writeFileSync('result.png', canvas.toBuffer());
});
