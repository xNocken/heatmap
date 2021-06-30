const { createCanvas, loadImage } = require('canvas');

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

const getColorPalette = (config) => {
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

/**
 * @returns Canvas
 */
const heatmap = async (inConfig) => {
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

  const canvas = createCanvas(config.width, config.height);
  const ctx = canvas.getContext('2d');

  const background = await loadImage(config.backgroundPath);

  ctx.drawImage(background, 0, 0, config.width, config.height);

  if (!config.positions.length) {
    return canvas;
  }

  const colorPalette = getColorPalette(config);

  config.positions.forEach((pos, index) => {
    const centerSquare = {
      x: Math.floor(pos.x / config.squareSize),
      y: Math.floor(pos.y / config.squareSize),
    };

    const begin = {
      x: Math.max(centerSquare.x - maxAmounOfReachableSquares, 0),
      y: Math.max(centerSquare.y - maxAmounOfReachableSquares, 0),
    }

    const end = {
      x: Math.min(centerSquare.x + maxAmounOfReachableSquares, squaresWidth),
      y: Math.min(centerSquare.y + maxAmounOfReachableSquares, squaresHeight),
    }

    for (let squareX = begin.x; squareX < end.x; squareX++) {
      for (let squareY = begin.y; squareY < end.y; squareY++) {
        const awayFromCenter = Math.abs(centerSquare.x - squareX) + Math.abs(centerSquare.y - squareY);
        const awayFromCenterPercentage = awayFromCenter / maxAwayFromCenter;
        const weight = getCenterBasedOnPercent(config.maxWeight, config.minWeight, awayFromCenterPercentage);

        const centerPos = {
          x: squareX * config.squareSize + config.squareSize / 2,
          y: squareY * config.squareSize + config.squareSize / 2,
        };

        const distance = get2DDistance(centerPos, pos);

        if (distance < config.radius) {
          squares[squareX][squareY] += weight;

          if (squares[squareX][squareY] > highestVal) {
            highestVal = squares[squareX][squareY];
          }
        }
      }
    }
  });

  squares.forEach((row, x) => {
    row.forEach((value, y) => {
      const color = colorPalette[~~(value / highestVal * 100)];

      ctx.drawImage(color, x * config.squareSize, y * config.squareSize, config.squareSize, config.squareSize);
    });
  });

  if (config.debug) {
    colorPalette.forEach((color, index) => {
      ctx.drawImage(color, 0, index * 20, 20, 20);
    });
  }

  return canvas;
};

module.exports = heatmap;
