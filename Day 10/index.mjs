import fs from 'fs/promises';

// -------------------------------------------------------------------------------------------------

class Instruction {
    *executeCycle() { throw new Error('Not implemented'); }
}

class AddxInstruction extends Instruction {
    #value = 0;

    constructor(value) {
        super();
        this.#value = value;
    }

    *executeCycle() {
        yield null;
        yield this.#value;
    }
}

class NoopInstruction extends Instruction {
    *executeCycle() {
        yield null;
    }
}

class Program {
    #instructions;

    constructor(instructions) {
        this.#instructions = instructions;
    }

    *execute() {
        for (const instruction of this.#instructions)
            yield* instruction.executeCycle();
    }
}

class SignalProcessor {
    execute(program, instructionCallback = null) {
        let register = /* initial value= */ 1;
        let cycle = 1;

        for (const mutation of program.execute()) {
            if (instructionCallback)
                instructionCallback(cycle, register);

            cycle++;

            if (mutation !== null)
                register += mutation;
        }
    }
}

// -------------------------------------------------------------------------------------------------

const programLines = await fs.readFile('program.txt', { encoding: 'utf8' });
let program = null;

// parse |program|
{
    const instructions = [];

    for (const instruction of programLines.split('\r\n')) {
        const args = instruction.split(' ');
        switch (args[0]) {
            case 'addx':
                instructions.push(new AddxInstruction(parseInt(args[1])));
                break;

            case 'noop':
                instructions.push(new NoopInstruction());
                break;

            default:
                throw new Error('Invalid instruction: ' + args[0]);
        }
    }

    program = new Program(instructions);
}

// part 1
{
    const kInitialCycle = 20;
    const kInterval = 40;

    let answer = 0;

    const processor = new SignalProcessor();
    processor.execute(program, (cycle, value) => {
        if ((cycle - kInitialCycle) % kInterval === 0)
            answer += cycle * value;
    });

    console.log('Part 1:', answer);
}

// part 2
{
    const kScreenWidth = 40;
    const kScreenHeight = 6;

    const screen = [ ...new Array(kScreenHeight) ].map(_ => '.'.repeat(kScreenWidth).split(''));

    const processor = new SignalProcessor();
    processor.execute(program, (cycle, value) => {
        const column = (cycle - 1) % kScreenWidth;
        const row = Math.floor((cycle - 1) / kScreenWidth);

        if (value >= column - 1 && value <= column + 1)
            screen[row][column] = '#';
    });

    console.log('Part 2:');

    for (const column of screen)
        console.log(column.join(''));
}
