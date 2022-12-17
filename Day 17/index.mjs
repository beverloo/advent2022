import fs from 'fs/promises';

// -------------------------------------------------------------------------------------------------

const kLeft = /* < */ 60;
const kRight = /* > */ 62;
const kDown = /* v */ 118;

const kHorizontalOffset = {
    [kLeft]: -1n,
    [kRight]: 1n,
    [kDown]: 0n,
};

const kVerticalOffset = {
    [kLeft]: 0n,
    [kRight]: 0n,
    [kDown]: -1n,
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
        this.#height = 0n;
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

        if (this.#height < y + 1n)
            this.#height = y + 1n;
    }

    __hash(x, y) { return y * 10000n + x; }
}

class Rock {
    #shape;
    #size;
    #type;

    constructor(type, shape) {
        this.#shape = shape.map(row => row.map(column => column === '#'));

        this.#type = type;
        this.#size = {
            width: BigInt(shape[0].length),
            height: BigInt(shape.length),
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
        for (let shapeX = 0n; shapeX < this.#size.width; ++shapeX) {
            for (let shapeY = 0n; shapeY < this.#size.height; ++shapeY) {
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
        for (let shapeX = 0n; shapeX < this.#size.width; ++shapeX) {
            for (let shapeY = 0n; shapeY < this.#size.height; ++shapeY) {
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
    get type() { return this.#type; }
}

class RockGenerator {
    #types;
    #offset;

    constructor() {
        this.#types = kRocks.map((shape, i) => new Rock(i, shape));
        this.#offset = 0;
    }

    reset() { this.#offset = 0; }

    *generator() {
        while (true)
            yield this.#types[this.#offset++ % this.#types.length];
    }
}

class CycleDetector {
    static kMinimumLength = 100;

    #iterations;

    #hashes = new Map();
    #heights = new Map();

    #cycleLength = 0;
    #cycleCandidate = 0;

    constructor(iterations) {
        this.#iterations = BigInt(iterations);
    }

    detect(iteration, iterationHash, iterationHeight) {
        if (this.#hashes.has(iterationHash)) {
            const iterations = iteration - this.#hashes.get(iterationHash);
            const height = iterationHeight - this.#heights.get(iterationHash);

            if (!this.#cycleCandidate) {
                this.#cycleCandidate = iterations;
                this.#cycleLength = 1;
            } else if (this.#cycleCandidate === iterations) {
                this.#cycleLength++;
            }

            if (this.#cycleLength >= CycleDetector.kMinimumLength) {
                const iterationRemainder = iteration % this.#cycleCandidate;
                const maximumRemainder = (this.#iterations - 1n) % this.#cycleCandidate;

                if (iterationRemainder === maximumRemainder)
                    return ((this.#iterations - iteration) / this.#cycleCandidate) * height;
            }
        } else {
            this.#cycleCandidate = 0;
        }

        this.#hashes.set(iterationHash, iteration);
        this.#heights.set(iterationHash, iterationHeight);
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
    const grid = new Grid(/* width= */ 7n);

    const patternGenerator = new PatternGenerator(patternInput).generator();
    const rockGenerator = new RockGenerator().generator();

    for (let iteration = 0; iteration < 2022; ++iteration) {
        const rock = rockGenerator.next().value;

        let topLeftX = /* two units away from the left wall= */ 2n;
        let topLeftY = /* three units above the highest rock= */ grid.height + rock.size.height + 2n;

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

            topLeftY -= 1n;
        }
    }

    console.log(`Part 1:`, grid.height);
}

// part 2
{
    const grid = new Grid(/* width= */ 7n);

    const cycleDetector = new CycleDetector(1000000000000);
    const patternGenerator = new PatternGenerator(patternInput).generator();
    const rockGenerator = new RockGenerator().generator();

    let movementPattern = 0n;

    for (let iteration = 0n; iteration < 1000000000000; ++iteration) {
        const rock = rockGenerator.next().value;

        let topLeftX = /* two units away from the left wall= */ 2n;
        let topLeftY = /* three units above the highest rock= */ grid.height + rock.size.height + 2n;

        while (true) {
            // (a) being pushed by a jet of hot gas
            const direction = patternGenerator.next().value;
            if (rock.canMove(grid, { topLeftX, topLeftY }, direction)) {
                topLeftX += kHorizontalOffset[direction];
                movementPattern++;
            }

            // (b) falling one unit down
            if (!rock.canMove(grid, { topLeftX, topLeftY }, kDown)) {
                rock.settle(grid, { topLeftX, topLeftY });
                break;
            }

            topLeftY -= 1n;
            movementPattern++;
        }

        const iterationHash = BigInt(rock.type) + (5n * (movementPattern % BigInt(patternInput.length)));
        const result = cycleDetector.detect(iteration, iterationHash, grid.height);
        if (result) {
            console.log('Part 2:', grid.height + result);
            break;
        }
    }
}
