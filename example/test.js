const fs = require('fs');
const heatmap = require('../index.js');
const locations = JSON.parse(fs.readFileSync(module.path + '/landingpos.json').toString());
const mapSize = 262656;

const getMapPos = (vector3, scaleFactor = 1) => ({
  x: ((mapSize / 2 + (vector3.y)) / mapSize) * scaleFactor,
  y: ((mapSize - (mapSize / 2 + (vector3.x))) / mapSize) * scaleFactor,
});
const positions = locations.map((location) => getMapPos({ x: Number(location.x), y: Number(location.y) }, 2048))

console.log('started');
console.time();

const heatmapp = heatmap({
  width: 2048,
  height: 2048,
  backgroundPath: module.path + '/map-16.40.png',
  squareSize: 4,
  radius: 50,
  minWeight: 1,
  maxWeight: 5,
});

while (positions.length) {
  heatmapp.addPositions(positions.splice(0, 100_000))
  console.timeLog();
}

heatmapp.drawHeatmap().then((canvas) => {
  fs.writeFileSync(module.path + '/result.png', canvas.toBuffer());
});

console.timeEnd();
