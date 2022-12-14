import fs from 'fs/promises';

// -------------------------------------------------------------------------------------------------

class CoordinateSet {
    #set = new Set();

    get size() { return this.#set.size; }

    has(x, y) { return this.#set.has(this.__hash(x, y)); }
    add(x, y) { return this.#set.add(this.__hash(x, y)); }
    delete(x, y) { this.#set.delete(this.__hash(x, y)); }

    __hash(x, y) { return y * 10000 + x; }
}

// -------------------------------------------------------------------------------------------------

// parse rocks.txt
const rocks = new CoordinateSet();

let lowestRock = Number.MIN_SAFE_INTEGER;
{
    const lines = await fs.readFile('rocks.txt', { encoding: 'utf8' });
    for (const line of lines.split('\r\n')) {
        const steps = line.split('->').map(v => v.trim().split(',').map(n => parseInt(n)));
        if (!steps.length)
            throw new Error('Found an empty line in rocks.txt');

        let [ x, y ] = steps.shift();
        if (lowestRock < y)
            lowestRock = y;

        while (steps.length) {
            const [ newX, newY ] = steps.shift();
            if (lowestRock < newY)
                lowestRock = newY;

            for (let stepX = Math.min(x, newX); stepX <= Math.max(x, newX); ++stepX)
                rocks.add(stepX, y);

            for (let stepY = Math.min(y, newY); stepY <= Math.max(y, newY); ++stepY)
                rocks.add(x, stepY);

            x = newX;
            y = newY;
        }
    }
}

// -------------------------------------------------------------------------------------------------

// part 1
{
    let done = false;

    const sand = new CoordinateSet();
    for (let units = 0; !done; ++units) {
        let [ sandX, sandY ] = [ 500, 0 ];

        while (true) {
            const offsetsToConsider = [
                // A unit of sand always falls down one step if possible.
                { x: 0, y: 1 },

                // If the tile immediately below is blocked (by rock or sand), the unit of sand
                // attempts to instead move diagonally one step down and to the left.
                { x: -1, y: 1 },

                // If that tile is blocked, the unit of sand attempts to instead move diagonally one
                // step down and to the right.
                { x: 1, y: 1 },
            ];

            let destinationFound = false;
            for (const offset of offsetsToConsider) {
                if (rocks.has(sandX + offset.x, sandY + offset.y))
                    continue;  // the destination is occupied by a rock

                if (sand.has(sandX + offset.x, sandY + offset.y))
                    continue;  // the destination is occupied by settled sand

                sandX += offset.x;
                sandY += offset.y;

                destinationFound = true;
                break;
            }

            // Is the sand flowing into the abyss below?
            if (destinationFound && sandY > lowestRock) {
                console.log('Part 1:', units);
                done = true;
                break;
            }

            // If all three possible destinations are blocked, the unit of sand comes to rest and no
            // longer moves, at which point the next unit of sand is created back at the source.
            if (!destinationFound) {
                sand.add(sandX, sandY);
                break;
            }
        }
    }
}

// part 2
{
    let done = false;

    const sand = new CoordinateSet();
    for (let units = 1; !done; ++units) {
        let [ sandX, sandY ] = [ 500, 0 ];

        while (true) {
            let destinationFound = false;

            for (const offset of [ { x: 0, y: 1 }, { x: -1, y: 1 }, { x: 1, y: 1 } ]) {
                if (sandY + offset.y >= lowestRock + 2)
                    continue;  // hit bedrock

                if (rocks.has(sandX + offset.x, sandY + offset.y))
                    continue;  // the destination is occupied by a rock

                if (sand.has(sandX + offset.x, sandY + offset.y))
                    continue;  // the destination is occupied by settled sand

                sandX += offset.x;
                sandY += offset.y;

                destinationFound = true;
                break;
            }

            if (destinationFound)
                continue;

            if (sandY === 0) {
                console.log('Part 2:', units);

                done = true;
                break;
            }

            sand.add(sandX, sandY);
            break;
        }
    }
}
