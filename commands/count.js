import fs, { createReadStream } from 'node:fs';
import { resolvePath } from '../utils/pathResolver.js';


export default async (currentDir, inputPath) => {
  const resolvedInput = resolvePath(currentDir, inputPath);

  if (!fs.existsSync(resolvedInput)) {
    console.log('Operation failed');
    return;
  }
  
  let lines = 0;
  let words = 0;
  let characters = 0;

  await new Promise((resolve, reject) => {
  const stream = createReadStream(resolvedInput, 'utf8');

  stream.on('data', chunk => {
    lines += chunk.split('\n').length - 1;
    words += chunk.trim().split(/\s+/).filter(w => w.length > 0).length;
    characters += chunk.length;
  });

  stream.on('end', () => {
    console.log(`Lines: ${lines}`);
    console.log(`Words: ${words}`);
    console.log(`Characters: ${characters}`);
    resolve();
  });

  stream.on('error', err => {
    reject(new Error(`Operation failed: ${err.message}`));
  });
  });
};