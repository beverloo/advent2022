import fs from 'fs/promises';

// -------------------------------------------------------------------------------------------------

const kDirectionUp = 0;
const kDirectionRight = 1;
const kDirectionDown = 2;
const kDirectionLeft = 3;

const kDirectionTranslation = {
    '^': kDirectionUp,
    '>': kDirectionRight,
    'v': kDirectionDown,
    '<': kDirectionLeft,
};

const kDirectionOffset = {
    [kDirectionUp]: { x: 0, y: -1 },
    [kDirectionRight]: { x: 1, y: 0 },
    [kDirectionDown]: { x: 0, y: 1 },
    [kDirectionLeft]: { x: -1, y: 0 },
};

const kMoveDirections = [
    { x: 0, y: -1 },  // up
    { x: 1, y: 0 },  // right
    { x: 0, y: 1 },  // down
    { x: -1, y: 0 },  // left
    { x: 0, y: 0 }  // wait
]

function hash(x, y) { return x * 10000 + y; }

class Grid {
    #blizzards;
    #occupied;

    #width = 0;
    #height = 0;

    constructor(blizzards, width, height) {
        this.#blizzards = blizzards;
        this.#occupied = new Set();

        this.#width = width;
        this.#height = height;

        for (const { x, y } of blizzards)
            this.#occupied.add(hash(x, y));
    }

    get blizzards() { return this.#blizzards; }

    get width() { return this.#width; }
    get height() { return this.#height; }

    isOccupied(x, y) { return this.#occupied.has(hash(x, y)); }
}

class Simulator {
    #cache;

    constructor(initialGrid) {
        this.#cache = new Map([
            [ 0, initialGrid ],
        ]);
    }

    computeGridForGeneration(generation) {
        const previousGeneration = this.getOrComputeGridForGeneration(generation - 1);
        const blizzards = [];

        for (let { x, y, direction } of previousGeneration.blizzards) {
            x += kDirectionOffset[direction].x;
            y += kDirectionOffset[direction].y;

            if (x < 0) x = previousGeneration.width - 1;
            if (x >= previousGeneration.width) x = 0;

            if (y < 0) y = previousGeneration.height - 1;
            if (y >= previousGeneration.height) y = 0;

            blizzards.push({ x, y, direction });
        }

        const currentGeneration =
            new Grid(blizzards, previousGeneration.width, previousGeneration.height);

        this.#cache.set(generation, currentGeneration);
        return currentGeneration;
    }

    getOrComputeGridForGeneration(generation) {
        return this.#cache.get(generation) || this.computeGridForGeneration(generation);
    }

    run(sourcePosition, targetPosition, currentGeneration = 1) {
        const visited = new Set();
        const queue = [
            { generation: currentGeneration, position: sourcePosition },
        ];

        while (queue.length) {
            const { generation, position } = queue.shift();
            const candidates =
                this.runGeneration(generation, position, sourcePosition, targetPosition);

            for (const { x, y } of candidates) {
                if (x === targetPosition.x && y === targetPosition.y)
                    return generation;

                const candidateHash = x * 10_000_000 + y * 10_000 + generation + 1;
                if (visited.has(candidateHash))
                    continue;

                visited.add(candidateHash);

                queue.push({
                    generation: generation + 1,
                    position: { x, y },
                });
            }
        }

        return null;
    }

    runGeneration(generation, position, sourcePosition, targetPosition) {
        const grid = this.getOrComputeGridForGeneration(generation);
        const candidates = [];

        for (const move of kMoveDirections) {
            const x = position.x + move.x;
            const y = position.y + move.y;

            if (x < 0 || x >= grid.width)
                continue;  // out of horizontal bounds

            if (y < 0 || y >= grid.height) {
                if (y === sourcePosition.y && x === sourcePosition.x)
                    ; // allow - source position
                else if (y === targetPosition.y && x === targetPosition.x)
                    ; // allow -- target position
                else
                    continue;  // out of vertical bounds
            }

            if (grid.isOccupied(x, y))
                continue;  // a storm is raging

            candidates.push({ x, y });
        }

        return candidates;
    }
}

// -------------------------------------------------------------------------------------------------

// parse |grid.txt|
let initialGrid = null;
let initialPosition = null;  // { x, y }
let targetPosition = null;  // { x, y }

{
    const grid = await fs.readFile('grid.txt', { encoding: 'utf8' });
    const rows = grid.split('\r\n');

    const blizzards = [];

    let maximumX = Number.MIN_SAFE_INTEGER;
    let maximumY = Number.MIN_SAFE_INTEGER;

    for (let y = 1; y < rows.length - 1; ++y) {
        for (let x = 1; x < rows[y].length - 1; ++x) {
            if (!kDirectionTranslation.hasOwnProperty(rows[y][x]))
                continue;

            blizzards.push({ x: x - 1, y: y - 1, direction: kDirectionTranslation[rows[y][x]] });

            maximumX = Math.max(maximumX, x - 1);
            maximumY = Math.max(maximumY, y - 1);
        }
    }

    initialGrid = new Grid(blizzards, /* width= */ maximumX + 1, /* height= */ maximumY + 1);
    initialPosition = { x: 0, y: -1 };
    targetPosition = { x: maximumX, y: maximumY + 1 };
}

// -------------------------------------------------------------------------------------------------

// part 1
{
    const simulator = new Simulator(initialGrid);
    const result = simulator.run(initialPosition, targetPosition);

    console.log('Part 1:', result);
}

// part 2
{
    const simulator = new Simulator(initialGrid);

    let generation = 1;
    generation = simulator.run(initialPosition, targetPosition, generation);
    generation = simulator.run(targetPosition, initialPosition, generation + 1);
    generation = simulator.run(initialPosition, targetPosition, generation + 1);

    console.log('Part 2:', generation);
}
