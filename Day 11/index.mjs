import fs from 'fs/promises';

// -------------------------------------------------------------------------------------------------

const kOperatorAdd = '+';
const kOperatorMultiply = '*';

const kInputValue = 'old';

class Monkey {
    static fromString(definition) {
        const monkey = new Monkey();

        for (const line of definition) {
            const [ key, value ] = line.split(': ');
            if (key.startsWith('Monkey')) {
                monkey.id = parseInt(key.substring(7));
                continue;
            }

            switch (key.trim()) {
                case 'Starting items':
                    monkey.items = value.split(', ').map(v => parseInt(v));
                    break;
                case 'Operation': {
                    const [ result, _, input, operator, mutator ] = value.split(' ');
                    if (![ kOperatorAdd, kOperatorMultiply ].includes(operator))
                        throw new Error('Invalid operator: ' + operator);

                    monkey.operationOperator = operator;
                    monkey.operationMutator =
                        mutator === kInputValue ? mutator
                                                : parseInt(mutator);
                    break;
                }
                case 'Test': {
                    const [ operation, _, divider ] = value.split(' ');
                    if (operation !== 'divisible')
                        throw new Error('Expected the test to be a divisor');

                    monkey.testDivider = parseInt(divider);
                    break;
                }
                case 'If false':
                case 'If true': {
                    const [ action, _1, _2, id ] = value.split(' ');
                    if (action !== 'throw')
                        throw new Error('Expected to be the action to be a throw');

                    if (key.endsWith('true'))
                        monkey.testMonkeyPass = parseInt(id);
                    else
                        monkey.testMonkeyFail = parseInt(id);

                    break;
                }
                default:
                    throw new Error('Invalid key: ' + key);
            }
        }

        return monkey;
    }

    id;

    items;
    inspections = 0;

    operationOperator;
    operationMutator;

    testDivider;
    testMonkeyPass;
    testMonkeyFail;
}

class MonkeySimulator {
    #monkeys;

    #simpleWorryReduction;
    #worryReductionModulo;

    constructor(monkeys, simpleWorryReduction) {
        this.#monkeys = new Map();

        this.#simpleWorryReduction = simpleWorryReduction;
        this.#worryReductionModulo = 1;

        for (const monkey of monkeys) {
            this.#monkeys.set(monkey.id, structuredClone(monkey));
            this.#worryReductionModulo *= monkey.testDivider;
        }
    }

    execute(rounds) {
        for (let round = 0; round < rounds; ++round)
            this.executeRound();

        const results = [];
        for (const monkey of this.#monkeys.values())
            results.push({ monkey: monkey.id, inspections: monkey.inspections });

        return results;
    }

    executeRound() {
        for (const monkey of this.#monkeys.values())
            this.executeMonkey(monkey);
    }

    executeMonkey(monkey) {
        while (monkey.items.length) {
            const [ item, target ] = this.executeItem(monkey, monkey.items.shift());
            if (!this.#monkeys.has(target))
                throw new Error('Invalid target: ' . target);

            this.#monkeys.get(target).items.push(item);
        }
    }

    executeItem(monkey, item) {
        const mutator =
            monkey.operationMutator === kInputValue ? item
                                                    : monkey.operationMutator;

        monkey.inspections++;

        let worryLevel = item;
        switch (monkey.operationOperator) {
            case kOperatorAdd:
                worryLevel += mutator;
                break;
            case kOperatorMultiply:
                worryLevel *= mutator;
                break;
            default:
                throw new Error('Invalid operator: ' . monkey.operationOperator);
        }

        if (this.#simpleWorryReduction)
            worryLevel = Math.floor(worryLevel / 3);
        else
            worryLevel = worryLevel % this.#worryReductionModulo;

        if (worryLevel % monkey.testDivider === 0)
            return [ worryLevel, monkey.testMonkeyPass ];
        else
            return [ worryLevel, monkey.testMonkeyFail ];
    }
}

// -------------------------------------------------------------------------------------------------

const monkeys = [];
{
    const monkeyLines = await fs.readFile('monkeys.txt', { encoding: 'utf8' });
    for (const monkeyDefinition of monkeyLines.split('\r\n\r\n'))
        monkeys.push(Monkey.fromString(monkeyDefinition.split('\r\n')));
}

// -------------------------------------------------------------------------------------------------

// part 1
{
    const simulator = new MonkeySimulator(monkeys, /*simpleWorryReduction=*/ true);
    const results = simulator.execute(/* rounds= */ 20);
    results.sort((a, b) => b.inspections - a.inspections);

    console.log('Part 1:', results[0].inspections * results[1].inspections);
}

// part 2
{
    const simulator = new MonkeySimulator(monkeys, /*simpleWorryReduction=*/ false);
    const results = simulator.execute(/* rounds= */ 10000);
    results.sort((a, b) => b.inspections - a.inspections);

    console.log('Part 2:', results[0].inspections * results[1].inspections);
}
