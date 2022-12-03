import fs from 'fs/promises';

const lines = await fs.readFile('guide.txt', { encoding: 'utf8' });
const rounds = lines.split('\r\n');

// Actions
const kRock = 'A';
const kPaper = 'B';
const kScissors = 'C';

const kTranslation = {
    X: kRock,
    Y: kPaper,
    Z: kScissors
};

const kWeakness = {
    [kRock]: kPaper,
    [kPaper]: kScissors,
    [kScissors]: kRock,
};

const kScore = {
    [kRock]: 1,
    [kPaper]: 2,
    [kScissors]: 3,
};

// part 1

let score = 0;
for (const round of rounds) {
    const [ action, reactionRaw ] = round.split(' ');
    const reaction = kTranslation[reactionRaw];

    if (action === reaction)
        score += 3;  // draw
    else if (kWeakness[action] === reaction)
        score += 6;  // won
    else
        ;  // lost

    score += kScore[reaction];
}

console.log('Part 1:', score);

// part 2

const kLose = 'X';
const kDraw = 'Y';
const kWin = 'Z';

score = 0;
for (const round of rounds) {
    const [ action, response ] = round.split(' ');

    let reaction = null;
    switch (response) {
        case kLose:
            reaction = kWeakness[kWeakness[action]];
            break;
        case kDraw:
            reaction = action;
            break;
        case kWin:
            reaction = kWeakness[action];
            break;
    }

    if (action === reaction)
        score += 3;  // draw
    else if (kWeakness[action] === reaction)
        score += 6;  // won
    else
        ;  // lost

    score += kScore[reaction];
}

console.log('Part 2:', score);
