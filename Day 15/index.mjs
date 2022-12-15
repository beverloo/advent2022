import fs from 'fs/promises';

// -------------------------------------------------------------------------------------------------

// parse sensors.txt
const sensors = [];

let minimumX = Number.MAX_SAFE_INTEGER;
let maximumX = Number.MIN_SAFE_INTEGER;

{
    const lines = await fs.readFile('sensors.txt', { encoding: 'utf8' });
    for (const line of lines.split('\r\n')) {
        const [ sensorX, sensorY, beaconX, beaconY ] =
            line.match(/=([\d\-]+)/g).map(v => parseInt(v.substring(1)));

        const range = Math.abs(sensorX - beaconX) + Math.abs(sensorY - beaconY);

        sensors.push({
            sensor: [ sensorX, sensorY ],
            beacon: [ beaconX, beaconY ],
            range,
        });

        minimumX = Math.min(minimumX, sensorX - range);
        maximumX = Math.max(maximumX, sensorX + range);
    }
}

// -------------------------------------------------------------------------------------------------

// part 1
{
    const y = 10;

    let discounted = 0;
    for (let x = minimumX; x < maximumX; ++x) {
        for (const { sensor, beacon, range } of sensors) {
            if (beacon[0] === x && beacon[1] === y)
                continue;  // ignore beacons

            const distance = Math.abs(sensor[0] - x) + Math.abs(sensor[1] - y);
            if (distance > range)
                continue;  // out of range

            discounted++;
            break;
        }
    }

    console.log('Part 1:', discounted);

}

// part 2 - yolo :)
{
    const results = [];

    for (let x = 0; x <= 4000000; ++x) {
        for (let y = 0; y <= 4000000; ++y) {
            let discounted = false;

            for (const { sensor, beacon, range } of sensors) {
                const distance = Math.abs(sensor[0] - x) + Math.abs(sensor[1] - y);
                if (distance > range)
                    continue;  // out of range

                discounted = true;
                break;
            }

            if (!discounted)
                results.push({ x, y });
        }
    }

    if (results.length != 1)
        throw new Error('Unexpectedly found multiple results');

    console.log('Part 2:', results[0].x * 4000000 + results[0].y);
}
