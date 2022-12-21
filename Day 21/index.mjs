import fs from 'fs/promises';

// -------------------------------------------------------------------------------------------------

class Operation {
    #operand;

    #left;
    #right;

    #result;

    static forResult(result) {
        return new Operation(null, null, null, BigInt(result));
    }

    static forCalculation(operand, left, right) {
        return new Operation(operand, left, right, null);
    }

    constructor(operand, left, right, result) {
        this.#operand = operand;

        this.#left = left;
        this.#right = right;

        this.#result = result;
    }

    get operand() { return this.#operand; }

    execute(scope) {
        if (this.#result)
            return { node: this, result: this.#result };

        if (!scope.has(this.#left))
            throw new Error('Unrecognised variable: ' + this.#left);

        if (!scope.has(this.#right))
            throw new Error('Unrecognised variable: ' + this.#right);

        const leftOperation = scope.get(this.#left);
        const left = leftOperation.execute(scope);

        const rightOperation = scope.get(this.#right);
        const right = rightOperation.execute(scope);

        let result = null;
        switch (this.#operand) {
            case '+':
                result = left.result + right.result;
                break;
            case '-':
                result = left.result - right.result;
                break;
            case '/':
                result = left.result / right.result;
                break;
            case '*':
                result = left.result * right.result;
                break;
            default:
                throw new Error('Unrecognised operand: ' + this.#operand);
        }

        return { node: this, left, right, result };
    }
}

// -------------------------------------------------------------------------------------------------

// parse |calculations.txt|
const scope = new Map();
{
    const calculations = await fs.readFile('calculations.txt', { encoding: 'utf8' });
    for (const line of calculations.split('\r\n')) {
        const [ label, operation ] = line.split(': ');
        if (operation.match(/^([\-\d]+)$/)) {
            scope.set(label, Operation.forResult(parseInt(operation)));
        } else {
            const [ _, left, operand, right ] = operation.match(/^([^\s]+)\s([\-\/*+])\s([^\s]+)$/);
            scope.set(label, Operation.forCalculation(operand, left, right));
        }
    }
}

// part 1
{
    console.log('Part 1:', scope.get('root').execute(scope).result);
}

// part 2
{
    const root = scope.get('root');
    const humn = scope.get('humn');

    // (1) compute |root| normally to get the execution tree
    const tree = root.execute(scope);
    
    // (2) find the path from |root| to |humn| through a depth first search
    let executionPath = null;

    {
        const stack = [{ node: tree, path: [] }];
        while (stack.length) {
            const { node, path } = stack.pop();

            if (node.node === humn) {
                executionPath = [ ...path, node ];
                break;
            }

            if (node.left)
                stack.push({ node: node.left, path: [ ...path, node ]});
            if (node.right)
                stack.push({ node: node.right, path: [ ...path, node ]});
        }
    }

    // (3) iterate over the |executionPath| to find the desired outcome
    let desiredResult = null;

    for (let step = 0; step < executionPath.length - 1; ++step) {
        const current = executionPath[step];
        const next = executionPath[step + 1];

        if (current.left.node === next.node) {
            if (desiredResult === null) {
                desiredResult = current.right.result;
                continue;
            }

            switch (current.node.operand) {
                case '+':
                    desiredResult = desiredResult - current.right.result;
                    break;
                case '-':
                    desiredResult = desiredResult + current.right.result;
                    break;
                case '/':
                    desiredResult = current.right.result * desiredResult;
                    break;
                case '*':
                    desiredResult = desiredResult / current.right.result;
                    break;
                default:
                    throw new Error('Invalid operand: ' + current.node.operand);
            }
        } else {
            if (desiredResult === null) {
                desiredResult = current.left.result;
                continue;
            }

            switch (current.node.operand) {
                case '+':
                    desiredResult = desiredResult - current.left.result;
                    break;
                case '-':
                    desiredResult = current.left.result - desiredResult;
                    break;
                case '/':
                    desiredResult = desiredResult * current.left.result;
                    break;
                case '*':
                    desiredResult = desiredResult / current.left.result;
                    break;
                default:
                    throw new Error('Invalid operand: ' + current.node.operand);
            }
        }
    }

    console.log('Part 2:', desiredResult);
}
