import fs from 'fs/promises';

const lines = await fs.readFile('cranes.txt', { encoding: 'utf8' });
const [ stateLines, moveLines ] = lines.split('\r\n\r\n');

const state = { /* empty default state */ };
const moves = [];

// parse |stateLines| into |state|
{
    const lines = stateLines.split('\r\n').reverse();
    lines.shift();  // drop the indices

    for (const line of lines) {
        for (let i = 0; i < line.length; i += 4) {
            const crate = line.substring(i + 1, i + 2);
            const crane = `${i / 4 + 1}`;

            if (crate === ' ')
                continue;  // no crate in this position

            if (!state.hasOwnProperty(crane))
                state[crane] = [];

            state[crane].push(crate);
        }
    }
}

// parse |moveLines| into |moves|
{
    const lines = moveLines.split('\r\n');
    for (const line of lines) {
        const [ _, count, source, target ] = line.match(/^move (\d+) from (\d+) to (\d+)$/);
        moves.push({ count: parseInt(count), source, target });
    }
}

// part 1
{
    const localState = structuredClone(state);
    for (const move of moves) {
        for (let i = 0; i < move.count; ++i)
            localState[move.target].push(localState[move.source].pop());
    }

    console.log('Part 1:', [ ...Object.values(localState) ].map(v => v.pop()).join(''));
}

// part 2
{
    const localState = structuredClone(state);
    for (const move of moves)
        localState[move.target].push(...localState[move.source].splice(0 - move.count));

    console.log('Part 2:', [ ...Object.values(localState) ].map(v => v.pop()).join(''));
}

