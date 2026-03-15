import { workerData, parentPort } from 'node:worker_threads';

const lines = workerData.lines;

// Partial stats this worker will return
const stats = {
  total          : 0,
  levels         : {},
  status         : { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 },
  paths          : {},
  responseTimeSum: 0,
};

for (const line of lines) {
  if (!line.trim()) continue; // skip empty lines

  //Parse log line
  // Format: <timestamp> <level> <service> <statusCode> <responseTimeMs> <method> <path>
  const parts = line.trim().split(' ');

  if (parts.length < 7) continue; // skip malformed lines

  const level        = parts[1];  // INFO / WARN / ERROR
  const statusCode   = parseInt(parts[3]);
  const responseTime = parseFloat(parts[4]);
  const logPath      = parts[6];  // e.g. /api/users

  stats.total++;

  //Count by level
  stats.levels[level] = (stats.levels[level] || 0) + 1;

  //Count by status class
  if (statusCode >= 200 && statusCode < 300)      stats.status['2xx']++;
  else if (statusCode >= 300 && statusCode < 400)  stats.status['3xx']++;
  else if (statusCode >= 400 && statusCode < 500)  stats.status['4xx']++;
  else if (statusCode >= 500 && statusCode < 600)  stats.status['5xx']++;

  //Count by path
  stats.paths[logPath] = (stats.paths[logPath] || 0) + 1;

  //Accumulate response time
  if (!isNaN(responseTime)) {
    stats.responseTimeSum += responseTime;
  }
}

// Send partial stats back to main thread
parentPort.postMessage(stats);