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
    // the first 248 rows are without a pattern
    // the following 2160 rows are a pattern that infinitely repeats
    // thus:
    // - head)   160 rocks
    // - middle) 589970501 * 1695 rocks
    // - tail)   645 rocks
    //
    // identified through rather manual pattern recognition and maths

    const grid = new Grid(/* width= */ 7);

    const patternGenerator = new PatternGenerator(patternInput).generator();
    const rockGenerator = new RockGenerator().generator();

    let head = null;
    let middle = null;
    let tail = null;

    for (let iteration = 0; iteration < 160 + 1695 + 645; ++iteration) {
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

        if (iteration < 160)
            head = grid.height;
        else if (iteration === 160 && head === grid.height)
            throw new Error('Unexpectedly found the same grid height after rock 161');

        if (iteration < 1855)
            middle = grid.height;
        else if (iteration === 1855 && middle === grid.height)
            throw new Error('Unexpectedly found the same grid height after rock 1855');
    }

    const repetitions = Math.floor(1000000000000 / 1695);
    const solution = head +
                     (repetitions * middle) +
                     (grid.height - middle);


    console.log(`Part 2:`, solution);
}
