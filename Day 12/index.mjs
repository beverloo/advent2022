import fs from 'fs/promises';

function calculateNodeId(x, y) {
    return `${y * 10000 + x}`;
}

// parse the input
let startPos = null;
let endPos = null;

const grid = [];
{
    const kStartPosition = 'S';
    const kEndPosition = 'E';

    const lines = await fs.readFile('map.txt', { encoding: 'utf8' });
    for (const line of lines.split('\r\n')) {
        const row = [];

        for (let index = 0; index < line.length; ++index) {
            let char = line.charCodeAt(index);

            if ([ kStartPosition, kEndPosition ].includes(line[index])) {
                switch (line[index]) {
                    case kStartPosition:
                        startPos = { x: index, y: grid.length };
                        char = /* a= */ 97;

                        break;
                    case kEndPosition:
                        endPos = { x: index, y: grid.length };
                        char = /* z= */ 122;

                        break;
                }
            }

            row.push(char - 97);
        }

        grid.push(row);
    }
}

function calculateDistanceFromPosition(startPos, endPos) {
    const visited = new Map();
    const queue = [
        { ...startPos, steps: 0 },
    ];

    while (queue.length) {
        const { x, y, steps } = queue.shift();
        if (x === endPos.x && y === endPos.y)
            return steps;

        const hash = calculateNodeId(x, y);
        if (visited.has(hash))
            continue;

        visited.set(hash, steps);

        for (const offset of [ { x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 } ]) {
            const neighbourX = x + offset.x;
            const neighbourY = y + offset.y;

            if (neighbourY < 0 || neighbourY >= grid.length)
                continue;  // out of bounds

            if (neighbourX < 0 || neighbourX >= grid[neighbourY].length)
                continue;  // out of bounds

            const neighbourHash = calculateNodeId(neighbourX, neighbourY);
            if (visited.has(neighbourHash))
                continue;  // already visited

            if (grid[y][x] < grid[neighbourY][neighbourX] - 1)
                continue;

            queue.push({
                x: neighbourX,
                y: neighbourY,
                steps: steps + 1,
            });
        }
    }

    return Number.POSITIVE_INFINITY;
}

// part 1
{
    console.log('Part 1:', calculateDistanceFromPosition(startPos, endPos));
}

// part 2
{
    let minimum = Number.MAX_SAFE_INTEGER;

    for (let y = 0; y < grid.length; ++y) {
        for (let x = 0; x < grid[y].length; ++x) {
            if (grid[y][x] !== /* a= */ 0)
                continue;

            const distance = calculateDistanceFromPosition({ x, y }, endPos);
            if (distance < minimum)
                minimum = distance;
        }
    }

    console.log('Part 2:', minimum);
}
