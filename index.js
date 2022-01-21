const { createCanvas, loadImage } = require('canvas');

const backgroundImageCache = {};

const defaultConfig = {
  width: 1000,
  height: 1000,
  backgroundPath: 'https://placekitten.com/1000/1000',
  positions: [],
  squareSize: 5,
  radius: 20,
  maxWeight: 5,
  minWeight: 1,
  debug: false,
  centerOfImage: null,
  colors: {
    0: {
      r: 0,
      g: 255,
      b: 255,
      a: 0,
    },
    15: {
      r: 0,
      g: 255,
      b: 255,
      a: 0,
    },
    20: {
      r: 0,
      g: 255,
      b: 255,
      a: 165,
    },
    60: {
      r: 0,
      g: 0,
      b: 255,
      a: 165,
    },
    100: {
      r: 255,
      g: 0,
      b: 0,
      a: 165,
    },
  },
}

/**
 * @param {number} val1
 * @param {number} val2
 * @param {number} percent
 * @returns {number}
 */
const getCenterBasedOnPercent = (val1, val2, percent) => ((val2 - val1) * percent) + val1;

/**
 * @param {Object} pos1
 * @param {Object} pos2
 * @returns {number}
 */
const get2DDistance = (pos1, pos2) => {
  const x = (pos1.x - pos2.x) ** 2;
  const y = (pos1.y - pos2.y) ** 2;

  return Math.sqrt(x + y);
};

/**
 * @param {number} number
 * @param {number} amount
 * @returns {string}
 */
const toHex = (number, amount = 2) => {
  const hexNumber = number.toString(16);

  return '0'.repeat(amount - hexNumber.length) + hexNumber;
}

const getColorPalette = async (config) => {
  const canvas = createCanvas(101, 1);
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 101, 1);
  let colorPalette = [];

  Object.entries(config.colors).forEach(([percentString, color]) => {
    const percent = parseInt(percentString, 10);

    const colorr = '#' + toHex(color.r) + toHex(color.g) + toHex(color.b) + toHex(color.a);

    gradient.addColorStop(percent / 100, colorr);
  });

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 101, 1);

  for (let i = 0; i < 101; i++) {
    const currentCanvas = createCanvas(1, 1);
    const currentCtx = currentCanvas.getContext('2d');

    currentCtx.drawImage(canvas, -i, 0);

    colorPalette.push(currentCanvas);
  }

  return colorPalette;
}

const heatmap = (inConfig) => {
  const config = {
    ...defaultConfig,
    ...inConfig,
  };

  let highestVal = 1;
  const maxAmounOfReachableSquares = Math.ceil(config.radius / config.squareSize) + 1;
  const maxAwayFromCenter = maxAmounOfReachableSquares * 2;
  const squaresWidth = Math.ceil(config.width / config.squareSize);
  const squaresHeight = Math.ceil(config.height / config.squareSize);
  const squares = Array(squaresHeight).fill(0).map(() => Array(squaresWidth).fill(0))

  if (!backgroundImageCache[config.backgroundPath]) {
    backgroundImageCache[config.backgroundPath] = loadImage(config.backgroundPath);
  }

  let xPos = 0;
  let yPos = 0;

  if (config.centerOfImage) {
    xPos = config.centerOfImage.x - (config.width / 2);
    yPos = config.centerOfImage.y - (config.height / 2);
  }

  const colorPalette = getColorPalette(config);

  const addPositions = (positions) => {
    const optimizedPositions = {};

    positions.forEach(({ x, y }) => {
      const squareX = Math.floor((x - xPos) / config.squareSize);
      const squareY = Math.floor((y - yPos) / config.squareSize);

      if (squareX < 0 || squareX >= squaresWidth || squareY < 0 || squareY >= squaresHeight) {
        return;
      }

      const string = `${squareX}.${squareY}`;

      if (!optimizedPositions[string]) {
        optimizedPositions[string] = {
          x, y,
          squareX,
          squareY,
          count: 1,
        }

        return;
      }

      optimizedPositions[string].count += 1;
    })

    Object.values(optimizedPositions).forEach((pos) => {
      const begin = {
        x: Math.max(pos.squareX - maxAmounOfReachableSquares, 0),
        y: Math.max(pos.squareY - maxAmounOfReachableSquares, 0),
      }

      const end = {
        x: Math.min(pos.squareX + maxAmounOfReachableSquares, squaresWidth),
        y: Math.min(pos.squareY + maxAmounOfReachableSquares, squaresHeight),
      }

      for (let squareX = begin.x; squareX < end.x; squareX++) {
        for (let squareY = begin.y; squareY < end.y; squareY++) {
          const awayFromCenter = Math.abs(pos.squareX - squareX) + Math.abs(pos.squareY - squareY);
          const awayFromCenterPercentage = awayFromCenter / maxAwayFromCenter;
          const weight = getCenterBasedOnPercent(config.maxWeight, config.minWeight, awayFromCenterPercentage);

          const centerPos = {
            x: squareX * config.squareSize + config.squareSize / 2,
            y: squareY * config.squareSize + config.squareSize / 2,
          };

          const distance = get2DDistance(centerPos, {
            x: pos.x - xPos,
            y: pos.y - yPos,
          });

          if (distance < config.radius) {
            squares[squareX][squareY] += weight * pos.count;

            if (squares[squareX][squareY] > highestVal) {
              highestVal = squares[squareX][squareY];
            }
          }
        }
      }
    });
  }

  const drawHeatmap = async () => {
    const thePalette = await colorPalette;
    const canvas = createCanvas(config.width, config.height);
    const ctx = canvas.getContext('2d');

    const background = await backgroundImageCache[config.backgroundPath];

    if (config.centerOfImage) {
      ctx.drawImage(background, -xPos, -yPos, background.width, background.height);
    } else {
      ctx.drawImage(background, 0, 0, config.width, config.height);
    }

    squares.forEach((row, x) => {
      row.forEach((value, y) => {
        const color = thePalette[~~(value / highestVal * 100)];

        ctx.drawImage(color, x * config.squareSize, y * config.squareSize, config.squareSize, config.squareSize);
      });
    });

    if (config.debug) {
      thePalette.forEach((color, index) => {
        ctx.drawImage(color, 0, index * 20, 20, 20);
      });
    }

    return canvas;
  }

  return {
    addPositions,
    drawHeatmap,
  };
};

module.exports = heatmap;
