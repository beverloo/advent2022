import fs from 'fs/promises';

// -------------------------------------------------------------------------------------------------

const kOperationMove = 0;
const kOperationTurn = 1;

const kDirectionRight = 0;
const kDirectionDown = 1;
const kDirectionLeft = 2;
const kDirectionUp = 3;

const kMoveDirections = {
    [kDirectionUp]: { x: 0, y: -1 },
    [kDirectionDown]: { x: 0, y: 1 },
    [kDirectionLeft]: { x: -1, y: 0 },
    [kDirectionRight]: { x: 1, y: 0 },
};

class Grid {
    static kEmpty = 0;
    static kWall = 1;

    #boundariesHorizontal;
    #boundariesVertical;

    #occupancyEmpty;
    #occupancyWall;

    constructor() {
        this.#boundariesHorizontal = {};
        this.#boundariesVertical = {};

        this.#occupancyEmpty = new Set();
        this.#occupancyWall = new Set();
    }

    markEmpty(x, y) { this.mark(x, y, Grid.kEmpty); }
    markWall(x, y) { this.mark(x, y, Grid.kWall); }

    mark(x, y, type) {
        const positionHash = this._computePositionHash(x, y);

        switch (type) {
            case Grid.kEmpty:
                this.#occupancyEmpty.add(positionHash);
                break;
            case Grid.kWall:
                this.#occupancyWall.add(positionHash);
                break;
            default:
                throw new Error('Requested invalid marker to be placed');
        }

        if (!this.#boundariesVertical.hasOwnProperty(x)) {
            this.#boundariesVertical[x] = {
                minimum: Number.MAX_SAFE_INTEGER,
                maximum: Number.MIN_SAFE_INTEGER
            };
        }

        this.#boundariesVertical[x].minimum = Math.min(this.#boundariesVertical[x].minimum, y);
        this.#boundariesVertical[x].maximum = Math.max(this.#boundariesVertical[x].maximum, y);

        if (!this.#boundariesHorizontal.hasOwnProperty(y)) {
            this.#boundariesHorizontal[y] = {
                minimum: Number.MAX_SAFE_INTEGER,
                maximum: Number.MIN_SAFE_INTEGER
            };
        }

        this.#boundariesHorizontal[y].minimum = Math.min(this.#boundariesHorizontal[y].minimum, x);
        this.#boundariesHorizontal[y].maximum = Math.max(this.#boundariesHorizontal[y].maximum, x);
    }

    isWall(x, y) {
        return this.#occupancyWall.has(this._computePositionHash(x, y));
    }

    getBoundaries({ row = null, column = null }) {
        if (row !== null) {
            if (!this.#boundariesHorizontal.hasOwnProperty(row))
                throw new Error('Row does not exist on the grid: ' + row);

            return this.#boundariesHorizontal[row];

        } else if (column !== null) {
            if (!this.#boundariesVertical.hasOwnProperty(column)) {
                console.log(this.#boundariesVertical)
                throw new Error('Column does not exist on the grid: ' + column);
            }

            return this.#boundariesVertical[column];

        } else {
            throw new Error('Invalid use of getBoundaries, need either row or column');
        }
    }

    _computePositionHash(x, y) {
        return x * 10000 + y;
    }
}

// -------------------------------------------------------------------------------------------------

// parse |grid.txt|
const grid = new Grid();
const sequence = [];

{
    const data = await fs.readFile('grid.txt', { encoding: 'utf8' });
    const [ gridData, sequenceData ] = data.split('\r\n\r\n');

    const gridLines = gridData.split('\r\n');
    for (let y = 0; y < gridLines.length; ++y) {
        for (let x = 0; x < gridLines[y].length; ++x) {
            switch (gridLines[y][x]) {
                case '.':
                    grid.markEmpty(x + 1, y + 1);
                    break;
                case '#':
                    grid.markWall(x + 1, y + 1);
                    break;
                default:
                    /* ignore */
            }
        }
    }

    for (let i = 0; i < sequenceData.length;) {
        if ([ 'L', 'R' ].includes(sequenceData[i])) {
            sequence.push({
                operation: kOperationTurn,
                direction: sequenceData[i] === 'L' ? kDirectionLeft
                                                   : kDirectionRight,
            });

            i++;
            continue;
        }

        const [ match ] = sequenceData.substring(i).match(/^(\d+)/);
        sequence.push({
            operation: kOperationMove,
            distance: parseInt(match),
        });

        i += match.length;
    }
}

// -------------------------------------------------------------------------------------------------

function navigate(transposeFn) {
    let direction = kDirectionRight;

    let x = grid.getBoundaries({ row: 1 }).minimum;
    let y = 1;

    for (let step = 0; step < sequence.length; ++step) {
        if (sequence[step].operation === kOperationTurn) {
            switch (sequence[step].direction) {
                case kDirectionLeft:
                    direction--;
                    break;
                case kDirectionRight:
                    direction++;
                    break;
                default:
                    throw new Error('Invalid turn direction: ' + sequence[step].direction);
            }

            direction = (direction + 4) % 4;
            continue;
        }

        for (let move = 0; move < sequence[step].distance; ++move) {
            let candidate = {
                x: x + kMoveDirections[direction].x,
                y: y + kMoveDirections[direction].y,
                direction,
            }

            if (direction === kDirectionUp || direction === kDirectionDown) {
                const boundaries = grid.getBoundaries({ column: x });
                if (candidate.y < boundaries.minimum || candidate.y > boundaries.maximum)
                    candidate = transposeFn(x, y, direction, boundaries);

            } else {
                const boundaries = grid.getBoundaries({ row: y });
                if (candidate.x < boundaries.minimum || candidate.x > boundaries.maximum)
                    candidate = transposeFn(x, y, direction, boundaries);
            }

            if (grid.isWall(candidate.x, candidate.y))
                break;

            direction = candidate.direction;

            x = candidate.x;
            y = candidate.y;
        }
    }

    return { x, y, direction };
}

// -------------------------------------------------------------------------------------------------

// part 1
{
    function PacManTranspose(x, y, direction, { minimum, maximum }) {
        switch (direction) {
            case kDirectionUp:
                return { x, y: maximum, direction };

            case kDirectionDown:
                return { x, y: minimum, direction };

            case kDirectionLeft:
                return { x: maximum, y, direction };

            case kDirectionRight:
                return { x: minimum, y, direction };
        }
    }

    const { x, y, direction } = navigate(PacManTranspose);
    console.log('Part 1:', y * 1000 + x * 4 + direction);
}

// part 2
{
    function IsConnected() {
        throw new Error('Unable to transpose, as these sides are meant to be connected');
    }

    const kCubeEdge = 50;
    const kCubeFaces = [
        {
            face: 1,
            corner: [ 50, 0 ],
            transpositions: {
                [kDirectionUp]: (x, y) => ({ x: 1, y: x + 100, direction: kDirectionRight }),
                [kDirectionDown]: IsConnected,
                [kDirectionLeft]: (x, y) => ({ x: 1, y: 151 - y, direction: kDirectionRight }),
                [kDirectionRight]: IsConnected,
            },
        },
        {
            face: 2,
            corner: [ 100, 0 ],
            transpositions: {
                [kDirectionUp]: (x, y) => ({ x: x - 100, y: 200, direction: kDirectionUp }),
                [kDirectionDown]: (x, y) => ({ x: 100, y: x - 50, direction: kDirectionLeft }),
                [kDirectionLeft]: IsConnected,
                [kDirectionRight]: (x, y) => ({ x: 100, y: 151 - y, direction: kDirectionLeft }),
            },
        },
        {
            face: 3,
            corner: [ 50, 50 ],
            transpositions: {
                [kDirectionUp]: IsConnected,
                [kDirectionDown]: IsConnected,
                [kDirectionLeft]: (x, y) => ({ x: y - 50, y: 101 /* 100? */, direction: kDirectionDown }),
                [kDirectionRight]: (x, y) => ({ x: y + 50, y: 50, direction: kDirectionUp }),
            },
        },
        {
            face: 4,
            corner: [ 0, 100 ],
            transpositions: {
                [kDirectionUp]: (x, y) => ({ x: 51 /* 50? */, y: x + 50, direction: kDirectionRight }),
                [kDirectionDown]: IsConnected,
                [kDirectionLeft]: (x, y) => ({ x: 51 /* 50? */, y: 151 - y, direction: kDirectionRight }),
                [kDirectionRight]: IsConnected,
            },
        },
        {
            face: 5,
            corner: [ 50, 100 ],
            transpositions: {
                [kDirectionUp]: IsConnected,
                [kDirectionDown]: (x, y) => ({ x: 50, y: x + 100, direction: kDirectionLeft }),
                [kDirectionLeft]: IsConnected,
                [kDirectionRight]: (x, y) => ({ x: 150, y: 151 - y, direction: kDirectionLeft }),
            },
        },
        {
            face: 6,
            corner: [ 0, 150 ],
            transpositions: {
                [kDirectionUp]: IsConnected,
                [kDirectionDown]: (x, y) => ({ x: x + 100, y: 1, direction: kDirectionDown }),
                [kDirectionLeft]: (x, y) => ({ x: y - 100, y: 1, direction: kDirectionDown }),
                [kDirectionRight]: (x, y) => ({ x: y - 100, y: 150, direction: kDirectionUp }),
            },
        },
    ];

    function determineFaceFromPosition(x, y) {
        for (const face of kCubeFaces) {
            if (x <= face.corner[0] || x > face.corner[0] + kCubeEdge)
                continue;  // x out of bounds
            if (y <= face.corner[1] || y > face.corner[1] + kCubeEdge)
                continue;  // y out of bounds

            return face;
        }

        throw new Error(`Unable to determine cube face from position (${x}, ${y})`);
    }

    function CubeTranspose(x, y, direction) {
        const face = determineFaceFromPosition(x, y);
        const transposeFn = face.transpositions[direction];

        return transposeFn(x, y);
    }

    const { x, y, direction } = navigate(CubeTranspose);
    console.log('Part 2:', y * 1000 + x * 4 + direction);
}
