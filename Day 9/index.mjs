import fs from 'fs/promises';

const moveLines = await fs.readFile('moves.txt', { encoding: 'utf8' });
const moves = [];

function calculatePositionHash(entity) {
    return entity.x * 10000 + entity.y;
}

const kMovement = {
    U: { x:  0, y: -1 },
    R: { x:  1, y:  0 },
    D: { x:  0, y:  1 },
    L: { x: -1, y:  0 },
};

// parse the input
for (const move of moveLines.split('\r\n')) {
    const [ direction, steps ] = move.split(' ');
    moves.push({
        direction,
        steps: parseInt(steps),
    });
}

// part 1
{
    const visited = new Set();

    let head = { x: 0, y: 0 };
    let tail = { x: 0, y: 0 };

    for (const { direction, steps } of moves) {
        for (let step = 0; step < steps; ++step) {
            head.x += kMovement[direction].x;
            head.y += kMovement[direction].y;

            const horizontalDistance = Math.abs(head.x - tail.x);
            const verticalDistance = Math.abs(head.y - tail.y);

            if (horizontalDistance > 1 || verticalDistance > 1) {
                tail.x += Math.min(Math.max(head.x - tail.x, -1), 1);
                tail.y += Math.min(Math.max(head.y - tail.y, -1), 1);
            }

            visited.add(calculatePositionHash(tail));
        }
    }

    console.log('Part 1:', visited.size);
}

// part 2
{
    const kKnots = 10;

    const visited = new Set();
    const knots = [];

    for (let knot = 0; knot < kKnots; ++knot)
        knots[knot] = structuredClone({ x: 0, y: 0 });

    for (const { direction, steps } of moves) {
        for (let step = 0; step < steps; ++step) {
            knots[0].x += kMovement[direction].x;
            knots[0].y += kMovement[direction].y;

            for (let knot = 1; knot < kKnots; ++knot) {
                const current = knots[knot];
                const previous = knots[knot - 1];

                const horizontalDistance = Math.abs(previous.x - current.x);
                const verticalDistance = Math.abs(previous.y - current.y);

                if (horizontalDistance > 1 || verticalDistance > 1) {
                    current.x += Math.min(Math.max(previous.x - current.x, -1), 1);
                    current.y += Math.min(Math.max(previous.y - current.y, -1), 1);
                }
            }

            visited.add(calculatePositionHash(knots[kKnots - 1]));
        }
    }

    console.log('Part 2:', visited.size);
}
