import fs   from 'node:fs';
import os   from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker }  from 'node:worker_threads';
import { resolvePath } from '../utils/pathResolver.js';

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const workerPath = path.resolve(__dirname, '../workers/logWorker.js');

export default async (currentDir, inputPath, outputPath) => {
  const resolvedInput  = resolvePath(currentDir, inputPath);
  const resolvedOutput = resolvePath(currentDir, outputPath);

  //Check input file exists
  if (!fs.existsSync(resolvedInput)) {
    console.log('Operation failed');
    return;
  }

  //Read file into lines using Streams
  const allLines = await new Promise((resolve, reject) => {
    const lines    = [];
    let   leftover = '';

    const readStream = fs.createReadStream(resolvedInput, { encoding: 'utf-8' });

    readStream.on('data', (chunk) => {
      const text       = leftover + chunk;
      const splitLines = text.split('\n');
      leftover         = splitLines.pop(); 
      lines.push(...splitLines);
    });

    readStream.on('end',   ()    => { if (leftover.trim()) lines.push(leftover); resolve(lines); });
    readStream.on('error', reject);
  });

  //Split lines into N chunks on line boundaries
  const numCores  = os.cpus().length;
  const chunkSize = Math.ceil(allLines.length / numCores);
  const chunks    = [];

  for (let i = 0; i < numCores; i++) {
    const start = i * chunkSize;
    const chunk = allLines.slice(start, start + chunkSize); // line boundary guaranteed
    if (chunk.length > 0) chunks.push(chunk);
  }

  //Create one Worker per chunk 
    const partialResults = await Promise.all(
    chunks.map((chunk) => {
      return new Promise((resolve, reject) => {
        const worker = new Worker(workerPath, {
          workerData: { lines: chunk }
        });

        worker.on('message', (stats) => { resolve(stats); worker.terminate(); });
        worker.on('error',   reject);
      });
    })
  );

  //Merge all partial results from workers
  const merged = {
    total          : 0,
    levels         : {},
    status         : { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 },
    paths          : {},
    responseTimeSum: 0,
  };

  for (const partial of partialResults) {
    // Merge total
    merged.total += partial.total;

    // Merge levels  e.g. { INFO: 700, WARN: 200, ERROR: 100 }
    for (const [level, count] of Object.entries(partial.levels)) {
      merged.levels[level] = (merged.levels[level] || 0) + count;
    }

    // Merge status classes
    for (const cls of ['2xx', '3xx', '4xx', '5xx']) {
      merged.status[cls] += partial.status[cls];
    }

    // Merge path counts
    for (const [logPath, count] of Object.entries(partial.paths)) {
      merged.paths[logPath] = (merged.paths[logPath] || 0) + count;
    }

    // Merge response time sum
    merged.responseTimeSum += partial.responseTimeSum;
  }

  //Compute top 5 paths
  const topPaths = Object.entries(merged.paths)
    .map(([logPath, count]) => ({ path: logPath, count }))
    .sort((a, b) => b.count - a.count) // sort descending by count
    .slice(0, 5);                       // take top 5

  //Compute average response time 
  const avgResponseTimeMs = merged.total > 0
    ? parseFloat((merged.responseTimeSum / merged.total).toFixed(2))
    : 0;

 
  const output = {
    total           : merged.total,
    levels          : merged.levels,
    status          : merged.status,
    topPaths,
    avgResponseTimeMs,
  };

  await fs.promises.writeFile(
    resolvedOutput,
    JSON.stringify(output, null, 2)
  );

  console.log('Log stats written to', outputPath);
};