import fs from 'fs/promises';

// -------------------------------------------------------------------------------------------------

class Robot {
    #type;
    #costs;

    constructor(type, costs) {
        this.#type = type;
        this.#costs = costs;
    }

    get type() { return this.#type; }

    get oreCosts() { return this.#costs.ore; }
    get clayCosts() { return this.#costs.clay; }
    get obsidianCosts() { return this.#costs.obsidian; }
    get geodeCosts() { return this.#costs.geode; }

    canPurchase(situation) {
        return situation.items.ore >= this.#costs.ore &&
               situation.items.clay >= this.#costs.clay &&
               situation.items.obsidian >= this.#costs.obsidian &&
               situation.items.geode >= this.#costs.geode;
    }
}

class Blueprint {
    #id;

    #oreRobot;
    #clayRobot;
    #obsidianRobot;
    #geodeRobot;

    constructor(definition) {
        this.#id = definition.id;

        this.#oreRobot = new Robot('ore', definition.ore);
        this.#clayRobot = new Robot('clay', definition.clay);
        this.#obsidianRobot = new Robot('obsidian', definition.obsidian);
        this.#geodeRobot = new Robot('geode', definition.geode);
    }

    get id() { return this.#id; }

    get oreRobot() { return this.#oreRobot; }
    get clayRobot() { return this.#clayRobot; }
    get obsidianRobot() { return this.#obsidianRobot; }
    get geodeRobot() { return this.#geodeRobot; }
}

class Simulator {
    run(blueprints, minutes, selection) {
        const results = new Map();
        for (const blueprint of blueprints)
            results.set(blueprint, this.runBlueprint(blueprint, minutes, selection));

        return results;
    }

    runBlueprint(blueprint, minutes, selection) {
        let queue = [
            {
                remaining: minutes,
                score: /* initial score= */ 1,

                robots: {
                    ore: /* initial state= */ 1,
                    clay: 0,
                    obsidian: 0,
                    geode: 0,
                },
                items: {
                    ore: 0,
                    clay: 0,
                    obsidian: 0,
                    geode: 0,
                },
            }
        ];

        for (let generation = 0; generation < minutes; ++generation)
            queue = this.runGeneration(blueprint, queue, selection);

        return queue[0].items.geode;
    }

    runGeneration(blueprint, queue, selection) {
        let generationQueue = [];

        while (queue.length) {
            const situation = queue.pop();

            if (blueprint.geodeRobot.canPurchase(situation))
                this.queueSituation(generationQueue, situation, blueprint.geodeRobot);

            if (blueprint.obsidianRobot.canPurchase(situation))
                this.queueSituation(generationQueue, situation, blueprint.obsidianRobot);

            if (blueprint.clayRobot.canPurchase(situation))
                this.queueSituation(generationQueue, situation, blueprint.clayRobot);

            if (blueprint.oreRobot.canPurchase(situation))
                this.queueSituation(generationQueue, situation, blueprint.oreRobot);

            this.queueSituation(generationQueue, situation, /* no change */);
        }

        let maximumInGeneration = Number.MIN_SAFE_INTEGER;
        for (const situation of generationQueue)
            maximumInGeneration = Math.max(maximumInGeneration, situation.theoreticalMaximum);

        generationQueue = generationQueue.filter(situation => {
            return situation.theoreticalMaximum === maximumInGeneration;
        });

        generationQueue.sort((a, b) => {
            return a.score === b.score ? b.items.geode - a.items.geode
                                       : b.score - a.score;
        });

        return generationQueue.slice(0, selection);
    }

    queueSituation(queue, situation, newRobot = undefined) {
        const newSituation = structuredClone(situation);
        if (newRobot) {
            newSituation.robots[newRobot.type]++;
            newSituation.items[newRobot.type]--;

            newSituation.items.ore -= newRobot.oreCosts;
            newSituation.items.clay -= newRobot.clayCosts;
            newSituation.items.obsidian -= newRobot.obsidianCosts;
            newSituation.items.geode -= newRobot.geodeCosts;
        }

        // Update |newSituation| for the next cycle:
        newSituation.remaining -= 1;

        newSituation.items.ore += newSituation.robots.ore;
        newSituation.items.clay += newSituation.robots.clay;
        newSituation.items.obsidian += newSituation.robots.obsidian;
        newSituation.items.geode += newSituation.robots.geode;

        newSituation.theoreticalMaximum = this.computeTheoreticalMaximum(newSituation);
        newSituation.score = this.computeScore(newSituation);

        queue.push(newSituation);
    }

    computeTheoreticalMaximum(situation) {
        return (situation.items.geode) +
               (situation.robots.geode * situation.remaining) +
               (situation.remaining - 1) * situation.remaining;  // <-- one per remaining minute
    }

    computeScore(situation) {
        return (situation.items.geode + situation.robots.geode * situation.remaining) * 1_000_000 +
                situation.robots.obsidian * 10_000 +
                situation.robots.clay * 100 +
                situation.robots.ore;
    }
}

// -------------------------------------------------------------------------------------------------

const blueprints = [];
{
    const blueprintLines = await fs.readFile('blueprints.txt', { encoding: 'utf8' });
    for (const blueprintLine of blueprintLines.split('\r\n')) {
        const [ header, robotCosts ] = blueprintLine.split(': ');
        if (!header.startsWith('Blueprint'))
            throw new Error('Invalid blueprint definition found: ' + blueprintLine);

        const definition = {
            id: header.substring(10),

            ore: null,
            clay: null,
            obsidian: null,
            geode: null,
        };

        for (const specificRobotCosts of robotCosts.split('. ')) {
            const [ _, type, costs ] = specificRobotCosts.match(/^Each ([^\s]+) robot costs (.+?)\.?$/);
            if (!definition.hasOwnProperty(type))
                throw new Error('Invalid robot type found: ' + specificRobotCosts);

            const robotCosts = {
                ore: 0,
                clay: 0,
                obsidian: 0,
                geode: 0,
            };

            for (const [ value, inputType ] of costs.split(' and ').map(v => v.split(' '))) {
                if (!robotCosts.hasOwnProperty(inputType))
                    throw new Error('Invalid robot cost type found: ' + specificRobotCosts);

                robotCosts[inputType] = parseInt(value);
            }

            definition[type] = robotCosts;
        }

        blueprints.push(new Blueprint(definition));
    }
}

// -------------------------------------------------------------------------------------------------

// part 1
{
    const simulator = new Simulator();
    const results = simulator.run(blueprints, /* minutes= */ 24, /* selection= */ 50000);

    let quality = 0;
    for (const [ blueprint, maximumGeodes ] of results.entries())
        quality += blueprint.id * maximumGeodes;

    console.log('Part 1:', quality);
}

// part 2
{
    const simulator = new Simulator();
    const results = simulator.run(blueprints.slice(0, 3), /* minutes= */ 32, /* selection= */ 50000);

    let result = 1;
    for (const maximumGeodes of results.values())
        result *= maximumGeodes;

    console.log('Part 2:', result);
}
