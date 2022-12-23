import fs from 'fs/promises';

// -------------------------------------------------------------------------------------------------

const kNeighbours = [
    { x:  0, y: -1 }, // N
    { x:  1, y: -1 }, // NE
    { x:  1, y:  0 }, // E
    { x:  1, y:  1 }, // SE
    { x:  0, y:  1 }, // S
    { x: -1, y:  1 }, // SW
    { x: -1, y:  0 }, // W
    { x: -1, y:  -1 }, // NW
];

const kDirectionalSearches = [
    [ { x: -1, y: -1 }, { x:  0, y: -1 }, { x:  1, y: -1 } ],  // NW, N, NE
    [ { x: -1, y:  1 }, { x:  0, y:  1 }, { x:  1, y:  1 } ],  // SW, S, SE
    [ { x: -1, y: -1 }, { x: -1, y:  0 }, { x: -1, y:  1 } ],  // NW, W, SW
    [ { x:  1, y: -1 }, { x:  1, y:  0 }, { x:  1, y:  1 } ],  // NE, E, SE
];

function hash(x, y) { return x * 10000 + y; }

class Round {
    #elves;

    #grid;
    #boundaries;

    constructor(elves) {
        this.#elves = new Map(elves.map((v, i) => [ i, v ]));

        this.#grid = new Set();
        this.#boundaries = {
            horizontal: { minimum: Number.MAX_SAFE_INTEGER, maximum: Number.MIN_SAFE_INTEGER },
            vertical: { minimum: Number.MAX_SAFE_INTEGER, maximum: Number.MIN_SAFE_INTEGER },
        };

        for (const { x, y } of elves) {
            this.#grid.add(hash(x, y));

            this.#boundaries.horizontal.minimum = Math.min(this.#boundaries.horizontal.minimum, x);
            this.#boundaries.horizontal.maximum = Math.max(this.#boundaries.horizontal.maximum, x);

            this.#boundaries.vertical.minimum = Math.min(this.#boundaries.vertical.minimum, y);
            this.#boundaries.vertical.maximum = Math.max(this.#boundaries.vertical.maximum, y);
        }
    }

    get elves() { return this.#elves; }

    get width() {
        return this.#boundaries.horizontal.maximum - this.#boundaries.horizontal.minimum + 1
    }

    get height() {
        return this.#boundaries.vertical.maximum - this.#boundaries.horizontal.minimum + 1;
    }

    isAvailable(x, y) {
        return !this.#grid.has(hash(x, y));
    }
}

class Simulator {
    #idleCallback;
    #initialState;

    constructor(initialState) {
        this.#idleCallback = null;
        this.#initialState = initialState;
    }

    setIdleCallback(callback) {
        this.#idleCallback = callback;
    }

    run(rounds) {
        let state = this.#initialState;
        let running = true;

        for (let round = 0; round < rounds && running; ++round)
            [ state, running ] = this.runRound(state, round);
       
        return state;
    }

    runRound(state, round) {
        // During the first half of each round, each Elf considers the eight positions adjacent to
        // themself. If no other Elves are in one of those eight positions, the Elf does not do
        // anything during this round. Otherwise, the Elf looks in each of four directions in
        // |searches| and proposes moving one step in the first valid direction.
        const proposedMoveMap = new Map();
        const proposedMoves = new Map();

        for (const [ id, { x, y } ] of state.elves.entries()) {
            let allAvailable = true;

            for (const offset of kNeighbours) {
                if (state.isAvailable(x + offset.x, y + offset.y))
                    continue;
               
                allAvailable = false;
                break;
            }

            if (allAvailable)
                continue;  // the Elf does not do anything this round

            for (let direction = 0; direction < 4; ++direction) {
                let directionAvailable = true;
                let index = direction + round;

                const directionOffsets = kDirectionalSearches[index % kDirectionalSearches.length];
                for (const offset of directionOffsets) {
                    if (state.isAvailable(x + offset.x, y + offset.y))
                        continue;
                   
                    directionAvailable = false;
                    break;
                }

                if (!directionAvailable)
                    continue;  // try the next direction
               
                const target = {
                    x: x + directionOffsets[1].x,
                    y: y + directionOffsets[1].y,
                };

                const targetHash = hash(target.x, target.y);

                proposedMoveMap.set(targetHash, 1 + (proposedMoveMap.get(targetHash) ?? 0));
                proposedMoves.set(id, { target, targetHash });
                break;
            }
        }

        // In the second half of the round, each Elf moves to their proposed destination tile iff
        // they were the only Elf to propose moving to that position.
        const elves = [];

        let numberOfMoves = 0;
        for (const [ id, { x, y } ] of state.elves.entries()) {
            if (proposedMoves.has(id)) {
                const { target, targetHash } = proposedMoves.get(id);
                if (proposedMoveMap.get(targetHash) === 1) {
                    elves.push(target);

                    numberOfMoves++;
                    continue;
                }
            }

            elves.push({ x, y });
        }

        if (!numberOfMoves && this.#idleCallback)
            this.#idleCallback(round + 1);

        return [ new Round(elves), !!numberOfMoves ];
    }
}

// -------------------------------------------------------------------------------------------------

// Parse |input.txt|
let initialRound = null;

{
    const grid = await fs.readFile('input.txt', { encoding: 'utf8' });
    const rows = grid.split('\r\n');

    const elves = [];
    for (let y = 0; y < rows.length; ++y) {
        for (let x = 0; x < rows[y].length; ++x) {
            if (rows[y][x] === '#')
                elves.push({ x, y });
        }
    }

    initialRound = new Round(elves);
}

// -------------------------------------------------------------------------------------------------

// part 1
{
    const simulator = new Simulator(initialRound);
    const result = simulator.run(/* rounds= */ 10);

    const elves = result.elves.size;

    console.log('Part 1:', result.width * result.height - elves);
}

// part 2
{
    const simulator = new Simulator(initialRound);
    let result = 0;

    simulator.setIdleCallback(round => result = round);
    simulator.run(/* rounds= */ Number.MAX_SAFE_INTEGER);

    console.log('Part 2:', result);
}
