import fs from 'fs/promises';

const lines = await fs.readFile('sections.txt', { encoding: 'utf8' });
const pairs = lines.split('\r\n');

// part 1

let contains = 0;

for (const pair of pairs) {
    const [ first, second ] = pair.split(',');

    const [ firstStart, firstEnd ] = first.split('-').map(v => parseInt(v));
    const [ secondStart, secondEnd ] = second.split('-').map(v => parseInt(v));
    
    if (firstStart <= secondStart && firstEnd >= secondEnd)
        contains++;  // |first| contains |second|
    else if (secondStart <= firstStart && secondEnd >= firstEnd)
        contains++;  // |second| contains |first|
}

console.log('Part 1:', contains);

// part 2

let overlaps = 0;

for (const pair of pairs) {
    const [ first, second ] = pair.split(',');

    const [ firstStart, firstEnd ] = first.split('-').map(v => parseInt(v));
    const [ secondStart, secondEnd ] = second.split('-').map(v => parseInt(v));

    if (firstStart > secondEnd || firstEnd < secondStart)
        continue;

    overlaps++;
}

console.log('Part 2:', overlaps);