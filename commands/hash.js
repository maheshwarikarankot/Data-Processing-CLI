import fs from 'fs';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';
import { resolvePath } from '../utils/pathResolver.js';

export default async (currentDir, inputPath, algorithm = 'sha256', save = false) => {
  const resolvedInput = resolvePath(currentDir, inputPath);
  const supportedAlgorithms = ['sha256', 'md5', 'sha512'];

  if (!supportedAlgorithms.includes(algorithm)) {
    throw new Error('Operation failed');
  }

  try {
    const hash = crypto.createHash(algorithm);
    const readStream = fs.createReadStream(resolvedInput);
    
    await pipeline(readStream, hash);
    
    const hashValue = hash.digest('hex');
    console.log(`${algorithm}: ${hashValue}`);

    if (save) {
      const hashFilePath = `${resolvedInput}.${algorithm}`;
      await fs.promises.writeFile(hashFilePath, hashValue);
    }
  } catch (error) {
    throw new Error('Operation failed');
  }
};