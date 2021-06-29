const { createCanvas, loadImage } = require('canvas');

const defaultConfig = {
  width: 1000,
  height: 1000,
  backgroundPath: 'https://placekitten.com/1000/1000',
  positions: [],
  squareSize: 5,
  radius: 20,
}

/**
 *
 * @param {number} val1
 * @param {number} val2
 * @param {number} percent
 * @returns
 */
const getCenterBasedOnPercent = (val1, val2, percent) => ((val2 - val1) * percent) + val1;

const get2DDistance = (pos1, pos2) => {
  const x = (pos1.x - pos2.x) ** 2;
  const y = (pos1.y - pos2.y) ** 2;

  return Math.sqrt(x + y);
};

const colors = Object.entries({
  0: {
    r: 255,
    g: 255,
    b: 255,
    a: 0,
  },
  10: {
    r: 255,
    g: 255,
    b: 255,
    a: 0,
  },
  30: {
    r: 0,
    g: 0,
    b: 255,
    a: 200,
  },
  70: {
    r: 255,
    g: 255,
    b: 0,
    a: 200,
  },
  100: {
    r: 255,
    g: 0,
    b: 0,
    a: 200,
  },
});

const getColorByPercent = (percent) => {
  let lastColor = colors[0][1];
  let nextColor = colors[0][1];
  let nextPercent = -1;

  if (percent !== 0) {
    console
  }

  colors.forEach(([percentString, color]) => {
    const currentPercent = parseInt(percentString, 10);

    if (currentPercent <= percent) {
      lastColor = color;
    }

    if (nextPercent < percent) {
      nextColor = color;
      nextPercent = currentPercent;
    }
  });

  if (percent !== 0) {
    console
  }

  const color = {
    r: Math.round(getCenterBasedOnPercent(lastColor.r, nextColor.r, percent / 100)),
    g: Math.round(getCenterBasedOnPercent(lastColor.g, nextColor.g, percent / 100)),
    b: Math.round(getCenterBasedOnPercent(lastColor.b, nextColor.b, percent / 100)),
    a: Math.round(getCenterBasedOnPercent(lastColor.a, nextColor.a, percent / 100)),
  };
  return color;
}

const toHex = (number, amount = 2) => {
  const hexNumber = number.toString(16);

  return '0'.repeat(amount - hexNumber.length) + hexNumber;
}

const heatmap = async (inConfig) => {
  const config = {
    ...defaultConfig,
    ...inConfig,
  };

  let highestVal = 0;
  const maxAmounOfReachableSquares = Math.ceil(config.radius / config.squareSize) + 1;
  const squares = Array(Math.ceil(config.height / config.squareSize)).fill(0).map(() => Array(Math.ceil(config.height / config.squareSize)).fill(0))

  const canvas = createCanvas(config.width, config.height);
  const ctx = canvas.getContext('2d');

  const background = await loadImage(config.backgroundPath);

  ctx.drawImage(background, 0, 0, config.width, config.height);

  if (!config.positions.length) {
    return canvas;
  }

  config.positions.forEach((pos) => {
    const centerSquare = {
      x: Math.floor(pos.x / config.squareSize),
      y: Math.floor(pos.y / config.squareSize),
    };

    const begin = {
      x: centerSquare.x - maxAmounOfReachableSquares,
      y: centerSquare.y - maxAmounOfReachableSquares,
    }

    const end = {
      x: centerSquare.x + maxAmounOfReachableSquares,
      y: centerSquare.y + maxAmounOfReachableSquares,
    }

    for (let squareX = begin.x; squareX < end.x; squareX++) {
      for (let squareY = begin.y; squareY < end.y; squareY++) {
        const centerPos = {
          x: squareX * config.squareSize + config.squareSize / 2,
          y: squareY * config.squareSize + config.squareSize / 2,
        };

        const distance = get2DDistance(centerPos, pos);

        if (squares[squareX] && squares[squareX][squareY] !== undefined && distance < config.radius) {
          squares[squareX][squareY] += 1;

          if (squares[squareX][squareY] > highestVal) {
            highestVal = squares[squareX][squareY];
          }
        }
      }
    }
  });

  squares.forEach((row, x) => {
    row.forEach((value, y) => {
      const color = getColorByPercent(Math.round(value / highestVal * 100));

      ctx.fillStyle = '#' + toHex(color.r) + toHex(color.g) + toHex(color.b) + toHex(color.a);

      ctx.fillRect(x * config.squareSize, y * config.squareSize, config.squareSize, config.squareSize);
    });
  });

  return canvas;
};

module.exports = heatmap;
