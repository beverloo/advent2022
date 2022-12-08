import fs from 'fs/promises';

const treesData = await fs.readFile('trees.txt', { encoding: 'utf8' });
const treesLines = treesData.split('\r\n');

const trees = [];

// parse
for (const line of treesLines)
    trees.push([ ...line.trim().split('').map(v => parseInt(v)) ]);

// part 1
{
    function scanForGreaterOrEqualHeight(row, column, rowStep, columnStep) {
        const height = trees[row][column];

        while (true) {
            row += rowStep;
            column += columnStep;

            if (row < 0 || row >= trees.length)
                return true;  // reached the top or bottom of the grid
            if (column < 0 || column >= trees[0].length)
                return true;  // reached the left or right of the grid

            if (trees[row][column] >= height)
                return false;  // found a higher or equally high tree
        }
    }

    let visible = 0;
    for (let row = 0; row < trees.length; ++row) {
        for (let column = 0; column < trees[row].length; ++column) {
            const isVisible = scanForGreaterOrEqualHeight(row, column, -1,  0) ||
                              scanForGreaterOrEqualHeight(row, column,  1,  0) ||
                              scanForGreaterOrEqualHeight(row, column,  0, -1) ||
                              scanForGreaterOrEqualHeight(row, column,  0,  1);

            if (isVisible)
                visible++;
        }
    }

    console.log('Part 1:', visible);
}

// part 2
{
    function calculateScenicScore(row, column, rowStep, columnStep) {
        const height = trees[row][column];

        let score = 0;
        while (true) {
            row += rowStep;
            column += columnStep;

            if (row < 0 || row >= trees.length)
                return score;  // reached the top or bottom of the grid
            if (column < 0 || column >= trees[0].length)
                return score;  // reached the left or right of the grid

            score++;

            if (trees[row][column] >= height)
                return score;  // found a higher or equally high tree
        }
    }

    let maximumScore = Number.MIN_SAFE_INTEGER;
    for (let row = 0; row < trees.length; ++row) {
        for (let column = 0; column < trees[row].length; ++column) {
            const score = calculateScenicScore(row, column, -1,  0) *
                          calculateScenicScore(row, column,  1,  0) *
                          calculateScenicScore(row, column,  0, -1) *
                          calculateScenicScore(row, column,  0,  1);

            if (score > maximumScore)
                maximumScore = score;
        }
    }

    console.log('Part 2:', maximumScore);
}
