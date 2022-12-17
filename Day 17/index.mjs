import fs from 'fs/promises';

// -------------------------------------------------------------------------------------------------

const kLeft = /* < */ 60;
const kRight = /* > */ 62;
const kDown = /* v */ 118;

const kHorizontalOffset = {
    [kLeft]: -1,
    [kRight]: 1,
    [kDown]: 0,
};

const kVerticalOffset = {
    [kLeft]: 0,
    [kRight]: 0,
    [kDown]: -1,
}

const kRocks = [
    [ [ '#', '#', '#', '#' ] ],
    [ [ '.', '#', '.' ],
      [ '#', '#', '#' ],
      [ '.', '#', '.' ] ],
    [ [ '.', '.', '#' ],
      [ '.', '.', '#' ],
      [ '#', '#', '#' ] ],
    [ [ '#' ],
      [ '#' ],
      [ '#' ],
      [ '#' ] ],
    [ [ '#', '#' ],
      [ '#', '#' ] ],
];

class PatternGenerator {
    #input;
    #offset;

    constructor(input) {
        this.#input = input;
        this.#offset = 0;
    }

    reset() { this.#offset = 0; }

    *generator() {
        while (true)
            yield this.#input[this.#offset++ % this.#input.length];
    }
}

class Grid {
    #occupied;

    #width;
    #height;

    constructor(width) {
        this.#occupied = new Set();

        this.#width = width;
        this.#height = 0;
    }

    get width() { return this.#width; }
    get height() { return this.#height; }

    calculateRowHash(y) {
        let result = 0;
        for (let x = 0; x < this.#width; ++x) {
            if (!this.isAvailable(x, y))
                result += Math.pow(2, x);
        }

        return result;
    }

    isAvailable(x, y) {
        if (x < 0 || x >= this.#width || y < 0)
            return false;  // out of bounds

        return !this.#occupied.has(this.__hash(x, y));
    }

    settle(x, y) {
        this.#occupied.add(this.__hash(x, y));
        this.#height = Math.max(this.#height, y + 1);
    }

    __hash(x, y) { return y * 10000 + x; }
}

class Rock {
    #shape;
    #size;

    constructor(shape) {
        this.#shape = shape.map(row => row.map(column => column === '#'));
        this.#size = {
            width: shape[0].length,
            height: shape.length,
        };
    }

    canMove(grid, { topLeftX, topLeftY }, direction) {
        // fast path:
        if (direction === kLeft && topLeftX === 0)
            return false;

        if (direction === kRight && (topLeftX + this.#size.width) === grid.width)
            return false;

        if (direction === kDown && (topLeftY - this.#size.height) > grid.height)
            return true;

        // slow path:
        for (let shapeX = 0; shapeX < this.#size.width; ++shapeX) {
            for (let shapeY = 0; shapeY < this.#size.height; ++shapeY) {
                if (!this.#shape[shapeY][shapeX])
                    continue;  // ignore void spaces

                const x = topLeftX + shapeX + kHorizontalOffset[direction];
                const y = topLeftY - shapeY + kVerticalOffset[direction];

                if (!grid.isAvailable(x, y))
                    return false;
            }
        }

        return true;
    }

    settle(grid, { topLeftX, topLeftY }) {
        for (let shapeX = 0; shapeX < this.#size.width; ++shapeX) {
            for (let shapeY = 0; shapeY < this.#size.height; ++shapeY) {
                if (!this.#shape[shapeY][shapeX])
                    continue;  // ignore void spaces

                const x = topLeftX + shapeX;
                const y = topLeftY - shapeY;

                if (!grid.isAvailable(x, y))
                    throw new Error(`Cannot settle rock in occupied location (${x}, ${y})`);

                grid.settle(x, y);
            }
        }
    }

    get shape() { return this.#shape; }
    get size() { return this.#size; }
}

class RockGenerator {
    #types;
    #offset;

    constructor() {
        this.#types = kRocks.map(shape => new Rock(shape));
        this.#offset = 0;
    }

    reset() { this.#offset = 0; }

    *generator() {
        while (true)
            yield this.#types[this.#offset++ % this.#types.length];
    }
}

// -------------------------------------------------------------------------------------------------

// parse |pattern.txt|
let patternInput = [];
{
    const patternText = await fs.readFile('pattern.txt', { encoding: 'utf8' });

    for (let i = 0; i < patternText.length; ++i) {
        const pattern = patternText.charCodeAt(i);

        if (![ kLeft, kRight ].includes(pattern))
            throw new Error(`Invalid pattern at index ${i}: ${patternText[i]}`);

        patternInput.push(pattern);
    }
}

// -------------------------------------------------------------------------------------------------

function isOccupiedByFallingRock(rock, x, y, topLeftX, topLeftY) {
    if (x < topLeftX || x >= (topLeftX + rock.size.width))
        return false;
    if (y > topLeftY || y <= (topLeftY - rock.size.height))
        return false;

    return rock.shape[topLeftY - y][x - topLeftX] === '#';
}

function printGrid(grid, rock, topLeftX, topLeftY) {
    console.log('+' + ('-'.repeat(grid.width)) + '+');

    for (let y = grid.height + rock.size.height + 3; y >= 0; --y) {
        const row = [];

        for (let x = 0; x < grid.width; ++x) {
            if (isOccupiedByFallingRock(rock, x, y, topLeftX, topLeftY))
                row.push('@');
            else if (!grid.isAvailable(x, y))
                row.push('#');
            else
                row.push('.');
        }

        console.log([ '|', ...row, '|' ].join(''));
    }

    console.log('+' + ('-'.repeat(grid.width)) + '+');
    console.log('');
}

function identifyRepeatingPatterns(grid) {
    const hashes = [];
    for (let y = 0; y < grid.height; ++y)
        hashes.push(grid.calculateRowHash(y));

    for (let windowSize = 2; windowSize < 5000; ++windowSize) {
        for (let startY = 0; startY < windowSize; ++startY) {
            if (startY + windowSize * 2 > hashes.length)
                break;  // not enough data

            let match = true;

            for (let y = startY; y < startY + windowSize; ++y) {
                if (hashes[y] === hashes[y + windowSize])
                    continue;

                match = false;
                break;
            }

            if (match) {
                console.log(`Found pattern w/ windowSize=${windowSize} at y=${startY}`);
                break;
            }
        }
    }
}

// -------------------------------------------------------------------------------------------------

// part 1
{
    const grid = new Grid(/* width= */ 7);

    const patternGenerator = new PatternGenerator(patternInput).generator();
    const rockGenerator = new RockGenerator().generator();

    for (let iteration = 0; iteration < 2022; ++iteration) {
        const rock = rockGenerator.next().value;

        let topLeftX = /* two units away from the left wall= */ 2;
        let topLeftY = /* three units above the highest rock= */ grid.height + rock.size.height + 2;

        while (true) {
            // (a) being pushed by a jet of hot gas
            const direction = patternGenerator.next().value;
            if (rock.canMove(grid, { topLeftX, topLeftY }, direction))
                topLeftX += kHorizontalOffset[direction];

            // (b) falling one unit down
            if (!rock.canMove(grid, { topLeftX, topLeftY }, kDown)) {
                rock.settle(grid, { topLeftX, topLeftY });
                break;
            }

            topLeftY -= 1;
        }
    }

    console.log(`Part 1:`, grid.height);
}

// part 2
{
    const grid = new Grid(/* width= */ 7);

    const patternGenerator = new PatternGenerator(patternInput).generator();
    const rockGenerator = new RockGenerator().generator();

    // (a) find a repeating window in the data
    let windowOffset = null;
    let window = null;




    for (let iteration = 0; iteration < 1000000000000; ++iteration) {
        const rock = rockGenerator.next().value;

        let topLeftX = /* two units away from the left wall= */ 2;
        let topLeftY = /* three units above the highest rock= */ grid.height + rock.size.height + 2;

        while (true) {
            // (a) being pushed by a jet of hot gas
            const direction = patternGenerator.next().value;
            if (rock.canMove(grid, { topLeftX, topLeftY }, direction))
                topLeftX += kHorizontalOffset[direction];

            // (b) falling one unit down
            if (!rock.canMove(grid, { topLeftX, topLeftY }, kDown)) {
                rock.settle(grid, { topLeftX, topLeftY });
                break;
            }

            topLeftY -= 1;
        }

        if (iteration % 10000 === 0) {
            identifyRepeatingPatterns(grid);
        }
    }

    console.log(`Part 2:`, grid.height);
}
