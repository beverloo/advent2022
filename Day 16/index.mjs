import fs from 'fs/promises';

// -------------------------------------------------------------------------------------------------

class Graph {
    #nodes = {};
    #edges = {};
    #distances;

    createNode(identifier, value) {
        this.#nodes[identifier] = value;
    }

    createEdge(left, right) {
        if (!this.#edges.hasOwnProperty(left))
            this.#edges[left] = {};

        if (!this.#edges.hasOwnProperty(right))
            this.#edges[right] = {};

        this.#edges[left][right] = true;
        this.#edges[right][left] = true;
    }

    finalize() {
        this.#distances = {};

        for (const source of Object.keys(this.#nodes)) {
            this.#distances[source] = {};

            const visited = new Set();

            let queue = [ source ];
            let distance = 0;

            while (queue.length) {
                const currentQueue = [ ...queue ];
                queue = [];

                for (const target of currentQueue) {
                    if (visited.has(target))
                        continue;

                    visited.add(target);

                    this.#distances[source][target] = distance;

                    for (const edge of Object.keys(this.#edges[target]))
                        queue.push(edge);
                }

                distance++;
            }
        }
    }

    getDistance(left, right) { return this.#distances[left][right]; }

    selectNeighbours(node) {
        if (!this.#distances.hasOwnProperty(node))
            throw new Error('Invalid node specified');

        const neighbours = [];
        for (const neighbour of Object.keys(this.#distances[node])) {
            if (this.#nodes[neighbour] <= 0)
                continue;  // require a positive flow rate

            neighbours.push({
                neighbour,
                neighbourFlowRate: this.#nodes[neighbour],
            });
        }

        return neighbours;
    }
}

class ChallengeSolver {
    #graph;

    constructor(graph) {
        this.#graph = graph;
    }

    evaluate(position, visitors, maximumTime) {
        if (![ 1, 2 ].includes(visitors))
            throw new Error('Only 1 or 2 visitors are supported.');

        const neighbours = this.#graph.selectNeighbours(position);

        const combinationCount = Math.pow(visitors, neighbours.length);
        const combinationPairs = [];

        for (var combination = 0; combination < combinationCount; combination++) {
            const selection = [ /* left= */ [], /* right= */ [] ];

            for (var neighbour = 0; neighbour < neighbours.length; neighbour++) {
                if ((combination & Math.pow(visitors, neighbour)))
                    selection[0].push(neighbours[neighbour]);
                else
                    selection[1].push(neighbours[neighbour]);
            }

            combinationPairs.push(selection);
        }

        let highestCombinedMaximumFlow = 0;

        for (const combinations of combinationPairs) {
            let combinedMaximumFlow = 0;

            for (const combination of combinations) {
                const result = { maximumFlow: Number.MIN_SAFE_INTEGER };
                const queue = [
                    {
                        position,
                        neighbours: combination,
                        remaining: maximumTime,
                        flowTotal: 0,
                        flowRate: 0,
                    }
                ];

                while (queue.length)
                    queue.push(...this.evaluatePermutations(queue.pop(), result));

                combinedMaximumFlow += result.maximumFlow;
            }

            if (highestCombinedMaximumFlow < combinedMaximumFlow)
                highestCombinedMaximumFlow = combinedMaximumFlow;
        }

        return highestCombinedMaximumFlow;
    }

    evaluatePermutations({ position, neighbours, remaining, flowTotal, flowRate }, result) {
        const paths = [];

        if (!neighbours.length) {
            result.maximumFlow = Math.max(result.maximumFlow, flowTotal + flowRate * remaining);
            return []
        }

        for (const { neighbour, neighbourFlowRate } of neighbours) {
            const distance = this.#graph.getDistance(position, neighbour) + /* open the valve= */ 1;
            if (distance >= remaining) {
                result.maximumFlow = Math.max(result.maximumFlow, flowTotal + flowRate * remaining);
                continue;
            }

            paths.push({
                position: neighbour,
                neighbours: neighbours.filter(v => v.neighbour !== neighbour),
                remaining: remaining - distance,
                flowTotal: flowTotal + flowRate * distance,
                flowRate: flowRate + neighbourFlowRate,
            });
        }

        return paths;
    }
}

// -------------------------------------------------------------------------------------------------

const kExpression = /^Valve (.+?) has flow rate=(\d+); tunnels? leads? to valves? (.+?)$/;
const graph = new Graph();

{
    const lines = await fs.readFile('valves.txt', { encoding: 'utf8' });
    for (const line of lines.split('\r\n')) {
        const [ _, identifier, value, edges ] = kExpression.exec(line);

        graph.createNode(identifier, parseInt(value));
        for (const targetIdentifier of edges.split(', '))
            graph.createEdge(identifier, targetIdentifier);
    }

    graph.finalize();
}

// -------------------------------------------------------------------------------------------------

// part 1
{
    const solver = new ChallengeSolver(graph);
    console.log('Part 1:', solver.evaluate(/* position= */ 'AA',
                                           /* visitors= */ 1,
                                           /* maximumTime= */ 30));
}

// part 2
{
    const solver = new ChallengeSolver(graph);
    console.log('Part 2:', solver.evaluate(/* position= */ 'AA',
                                           /* visitors= */ 2,
                                           /* maximumTime= */ 26));
}
