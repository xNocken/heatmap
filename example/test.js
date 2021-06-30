const fs = require('fs');
const heatmap = require('../index.js');
const locations = JSON.parse(fs.readFileSync(module.path + '/locations.json').toString());

const getMapPos = (vector3, scaleFactor = 1) => ({
  x: ((135000 + (vector3.y)) / 270000) * scaleFactor,
  y: ((270000 - (135000 + (vector3.x))) / 270000) * scaleFactor,
});
const positions = locations.map((location) => getMapPos({x: Number(location.x), y: Number(location.y)}, 2048))

console.time();
heatmap({
  positions,
  width: 2048,
  height: 2048,
  backgroundPath: module.path + '/map-16.40.png',
  squareSize: 1,
  radius: 50,
  minWeight: 1,
  maxWeight: 1,
  debug: true,
}).then((canvas) => {
  console.timeEnd();
  fs.writeFileSync(module.path + '/result.png', canvas.toBuffer());
});
