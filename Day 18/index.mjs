import fs from 'fs/promises';

// -------------------------------------------------------------------------------------------------

// parse |cubes.txt|
const cubes = [];
{
    const cubeData = await fs.readFile('cubes.txt', { encoding: 'utf8' });
    for (const cubeLine of cubeData.split('\r\n')) {
        const [ x, y, z ] = cubeLine.split(',').map(coord => parseInt(coord));
        cubes.push({ x, y, z });
    }
}

// -------------------------------------------------------------------------------------------------

function computeCoordinateHash(x, y, z) {
    return x * 10000 + y * 100 + z;
}

const kDirectNeighbours = [
    { x: -1, y:  0, z:  0 },
    { x:  1, y:  0, z:  0 },
    { x:  0, y: -1, z:  0 },
    { x:  0, y:  1, z:  0 },
    { x:  0, y:  0, z: -1 },
    { x:  0, y:  0, z:  1 },
];

const occupied = new Set();

let surfaceArea = 0;
let surface = {
    x: { minimum: Number.MAX_SAFE_INTEGER, maximum: Number.MIN_SAFE_INTEGER },
    y: { minimum: Number.MAX_SAFE_INTEGER, maximum: Number.MIN_SAFE_INTEGER },
    z: { minimum: Number.MAX_SAFE_INTEGER, maximum: Number.MIN_SAFE_INTEGER },
};

for (const cube of cubes) {
    occupied.add(computeCoordinateHash(cube.x, cube.y, cube.z));

    for (const offset of kDirectNeighbours) {
        const neighbourX = cube.x + offset.x;
        const neighbourY = cube.y + offset.y;
        const neighbourZ = cube.z + offset.z;

        const neighbourHash = computeCoordinateHash(neighbourX, neighbourY, neighbourZ);
        if (!occupied.has(neighbourHash))
            surfaceArea++;
        else
            surfaceArea--;
    }

    for (const dimension of ['x', 'y', 'z']) {
        surface[dimension].minimum = Math.min(surface[dimension].minimum, cube[dimension] - 1);
        surface[dimension].maximum = Math.max(surface[dimension].maximum, cube[dimension] + 1);
    }
}

// -------------------------------------------------------------------------------------------------

// part 1
{
    console.log('Part 1:', surfaceArea);
}

// part 2
{
    const visited = new Set();
    const stack = [
        { x: surface.x.minimum,
          y: surface.y.minimum,
          z: surface.z.minimum },
    ];

    while (stack.length) {
        const cube = stack.pop();

        for (const offset of kDirectNeighbours) {
            const neighbourX = cube.x + offset.x;
            const neighbourY = cube.y + offset.y;
            const neighbourZ = cube.z + offset.z;

            if (neighbourX < surface.x.minimum || neighbourX > surface.x.maximum)
                continue;  // out of x bounds
            if (neighbourY < surface.y.minimum || neighbourY > surface.y.maximum)
                continue;  // out of y bounds
            if (neighbourZ < surface.z.minimum || neighbourZ > surface.z.maximum)
                continue;  // out of z bounds

            const neighbourHash = computeCoordinateHash(neighbourX, neighbourY, neighbourZ);
            if (occupied.has(neighbourHash))
                continue;  // lava

            if (visited.has(neighbourHash))
                continue;  // already visited

            visited.add(neighbourHash);
            stack.push({
                x: neighbourX,
                y: neighbourY,
                z: neighbourZ,
            });
        }
    }

    let reachableSurfaceArea = 0;

    for (const cube of cubes) {
        for (const offset of kDirectNeighbours) {
            const neighbourX = cube.x + offset.x;
            const neighbourY = cube.y + offset.y;
            const neighbourZ = cube.z + offset.z;

            const neighbourHash = computeCoordinateHash(neighbourX, neighbourY, neighbourZ);
            if (visited.has(neighbourHash))
                reachableSurfaceArea++;
        }
    }

    console.log('Part 2:', reachableSurfaceArea);
}
