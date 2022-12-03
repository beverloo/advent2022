import fs from 'fs/promises';

const lines = await fs.readFile('rucksacks.txt', { encoding: 'utf8' });
const rucksacks = lines.split('\r\n');

const kPrioritiesInput = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const kPriorities = Object.fromEntries(kPrioritiesInput.split('').map((v, i) => [ v, (i + 1) ]));

// part 1

let score = 0;
for (const rucksack of rucksacks) {
    const firstCompartment = new Set(rucksack.substring(0, rucksack.length / 2));
    const secondCompartment = new Set(rucksack.substring(rucksack.length / 2));

    const intersection = new Set();
    for (const item of firstCompartment) {
        if (secondCompartment.has(item))
            intersection.add(item);
    }

    score += kPriorities[[ ...intersection ][0]];
}

console.log('Part 1:', score);

// part 2

score = 0;
while (rucksacks.length > 0) {
    const input = [
        new Set(rucksacks.shift()),
        new Set(rucksacks.shift()),
        new Set(rucksacks.shift()),
    ];

    const intersection = new Set();
    for (const item of input[0]) {
        if (!input[1].has(item) || !input[2].has(item))
            continue;

        score += kPriorities[item];
        break;
    }
}

console.log('Part 2:', score);
