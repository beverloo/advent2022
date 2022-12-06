import fs from 'fs/promises';

const buffer = await fs.readFile('buffer.txt', { encoding: 'utf8' });

function findIndexOfFirstUniqueSequence(input, length) {
    const lookback = [];

    let index = 0;
    for (; index < input.length; ++index) {
        const char = input[index];

        if (lookback.length < length) {
            lookback.push(char);
            continue;
        }

        lookback.shift();
        lookback.push(char);

        if ((new Set(lookback)).size === lookback.length)
            break;
    }

    return index === input.length ? null : index;
}

console.log('Part 1:', findIndexOfFirstUniqueSequence(buffer, 4) + 1);
console.log('Part 2:', findIndexOfFirstUniqueSequence(buffer, 14) + 1);
