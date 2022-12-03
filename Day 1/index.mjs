import fs from 'fs/promises';

const lines = await fs.readFile('calories.txt', { encoding: 'utf8' });
const elves = lines.split('\r\n\r\n');

// part 1

let max = 0;
for (const elf of elves) {
    let total = 0;
    for (const calories of elf.trim().split('\r\n')) {
        total += Number(calories);
    }

    max = Math.max(max, total);
}

console.log('Part 1:', max);

// part 2

const totals = [];
for (const elf of elves) {
    let total = 0;
    for (const calories of elf.trim().split('\r\n')) {
        total += Number(calories);
    }

    totals.push(total);
}

totals.sort((a, b) => b - a);

console.log('Part 2:', totals[0] + totals[1] + totals[2]);
