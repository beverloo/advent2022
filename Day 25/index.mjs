import fs from 'fs/promises';

// -------------------------------------------------------------------------------------------------

const kMultipliers = new Array(32).fill(null).map((v, i) => 5n ** BigInt(i));
const kDecimalToSnafuEncoding = {
    '2': 2n,
    '1': 1n,
    '0': 0n,
    '-': -1n,
    '=': -2n,
};

const kSnafuToDecimalEncoding = {
    [0n]: '0',
    [1n]: '1',
    [2n]: '2',
    [3n]: '=',  // increment n+1
    [4n]: '-',  // increment n+1
};

function dec2snafu(decimal) {
    let result = [];
    while (decimal > 0) {
        const remainder = decimal % 5n;
        decimal = decimal / 5n;

        result.push(kSnafuToDecimalEncoding[remainder]);
        if (remainder > 2)
            decimal++;
    }

    return result.reverse().join('');
}

function snafu2dec(snafu) {
    let result = 0n;
    for (let i = 0; i < snafu.length; ++i)
        result += kDecimalToSnafuEncoding[snafu[i]] * kMultipliers[snafu.length - 1 - i];

    return result;
}

// -------------------------------------------------------------------------------------------------

// part 1
{
    const balloons = await fs.readFile('balloons.txt', { encoding: 'utf8' });

    let result = 0n;
    for (const balloonSnafu of balloons.split('\r\n'))
        result += snafu2dec(balloonSnafu);

    console.log('Part 1:', dec2snafu(result));
}

// part 2
{
    // had a smoothie \o/
}
