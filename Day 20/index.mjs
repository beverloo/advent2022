import fs from 'fs/promises';

// -------------------------------------------------------------------------------------------------

function mixNumbers(input, multiplier, iterations) {
    const numbers = input.map(number => number * multiplier);
    const mixed = numbers.map((number, index) => ({ number, index }));

    for (let iteration = 0; iteration < iterations; ++iteration) {
        for (let index = 0; index < numbers.length; ++index) {
            const sourceIndex = mixed.findIndex(entry => entry.index === index);
            mixed.splice(sourceIndex, 1);

            const targetIndex = (numbers[index] + sourceIndex) % mixed.length;
            mixed.splice(targetIndex, 0, { number: numbers[index], index });
        }
    }

    return {
        numbers: mixed.map(entry => entry.number),
        start: mixed.findIndex(entry => entry.number === 0),
    };
}

// -------------------------------------------------------------------------------------------------

// parse |numbers.txt|
const numberLines = await fs.readFile('numbers.txt', { encoding: 'utf8' });
const numbers = numberLines.split('\r\n').map(v => parseInt(v));

// part 1
{
    const mixed = mixNumbers(numbers, /* multiplier= */ 1, /* iterations= */ 1);

    let result = 0;
    for (const indexAfterZero of [ 1000, 2000, 3000 ])
        result += mixed.numbers[(mixed.start + indexAfterZero) % mixed.numbers.length];

    console.log('Part 1:', result);
}

// part 2
{
    const mixed = mixNumbers(numbers, /* multiplier= */ 811589153, /* iterations= */ 10);

    let result = 0;
    for (const indexAfterZero of [ 1000, 2000, 3000 ])
        result += mixed.numbers[(mixed.start + indexAfterZero) % mixed.numbers.length];

    console.log('Part 2:', result);
}
