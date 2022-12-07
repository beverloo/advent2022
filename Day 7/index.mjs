import fs from 'fs/promises';

const commandLines = await fs.readFile('commands.txt', { encoding: 'utf8' });
const commands = commandLines.split('\r\n');

// part 1
let structure = new Object;
let current = null;

let path = [];

for (let index = 0; index < commands.length; ++index) {
    const command = commands[index];
    if (!command.startsWith('$'))
        throw new Error(`Expected a command line (${command})`);

    const args = command.substring(2).split(' ');
    const response = [];

    // Consume the response from |commands|
    for (let lookahead = index + 1; lookahead < commands.length; ++lookahead) {
        if (!commands[lookahead].startsWith('$'))
            response.push(commands[lookahead]);
        else
            break;
    }

    index += response.length;

    switch (args[0]) {
        case 'cd':
            switch (args[1]) {
                case '/':
                    path = [];
                    break;
                case '..':
                    path.pop();
                    break;
                default:
                    path.push(args[1]);
                    break;
            }

            current = structure;
            for (const dir of path)
                current = current[dir];

            break;
        case 'ls':
            for (const responseLine of response) {
                const [ size, name ] = responseLine.split(' ');

                if (size === 'dir') {
                    current[name] = new Object;
                } else {
                    current[name] = parseInt(size);
                }
            }
            break;
        default:
            throw new Error(`Unexpected command: ${args[0]}`);
    }
}

// Calculate totals in |structure| using a DFS, store in |sizes| to separate concerns
let sizes = new Map();

function computeDirectorySize(directory) {
    let total = 0;

    for (const [ name, entity ] of Object.entries(directory)) {
        if (typeof entity === 'object') {
            computeDirectorySize(entity);
            total += sizes.get(entity);
        } else {
            total += entity;
        }
    }

    sizes.set(directory, total);
}

computeDirectorySize(structure);

// part 1
{
    let total = 0;
    for (const [ directory, directorySize ] of sizes) {
        if (directorySize <= 100000)
            total += directorySize;
    }

    console.log('Part 1:', total);
}

// part 2
{
    const root = sizes.get(structure);

    const kSpaceTotal = 70000000;
    const kSpaceRequired = 30000000;

    if ((kSpaceTotal - root) > kSpaceRequired)
        throw new Error('There is enough hard drive space already.');

    const required = root - (kSpaceTotal - kSpaceRequired);

    let candidates = [];
    for (const [ directory, directorySize ] of sizes) {
        if (directorySize >= required)
            candidates.push(directorySize);
    }

    candidates.sort((a, b) => a - b);
    console.log('Part 2:', candidates[0]);
}