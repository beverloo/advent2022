import fs from 'fs/promises';

const lines = await fs.readFile('packets.txt', { encoding: 'utf8' });
const pairs = lines.split('\r\n\r\n');

// part 1
function ensureArray(item) {
    return Array.isArray(item) ? item : [ item ];
}

function compareLists(left, right, passValue = true) {
    let index = 0;
    for (; index < left.length; ++index) {
        if (index >= right.length)
            return false;  // |right| ran out of items

        if (typeof left[index] === 'number'  && typeof right[index] === 'number') {
            if (left[index] < right[index])
                return true;  // inputs are in the right order

            if (left[index] > right[index])
                return false;  // inputs are not in the right order

            continue;
        }

        const leftArray = ensureArray(left[index]);
        const rightArray = ensureArray(right[index]);

        const result = compareLists(leftArray, rightArray, /* passValue= */ null);
        if (result !== null)
            return result;  // bubble up
    }

    if (index < right.length)
        return true;  // |left| ran out of items first

    return passValue;  // all passed
}

{
    let index = 1;
    let result = 0;

    for (const pairLines of pairs) {
        const [ left, right ] = pairLines.split('\r\n').map(v => JSON.parse(v));

        if (compareLists(left, right))
            result += index;

        index++;
    }

    console.log('Part 1:', result);
}

// part 2
{
    const items = [
        [ [2] ],
        [ [6] ],
    ];

    for (const pairLines of pairs)
        pairLines.split('\n').map(v => items.push(JSON.parse(v)));

    items.sort((left, right) => {
        if (!compareLists(left, right))
            return 1;
       
        if (!compareLists(right, left))
            return -1;
       
        return 0;
    });

    let indices = [];
    for (let index = 0; index < items.length; ++index) {
        const itemString = JSON.stringify(items[index]);
        if (itemString === '[[2]]' || itemString === '[[6]]')
            indices.push(index + 1);
    }

    console.log('Part 2:', indices[0] * indices[1]);
}
