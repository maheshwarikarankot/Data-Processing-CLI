import fs from 'fs';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';
import { resolvePath } from '../utils/pathResolver.js';

export default async (currentDir, inputPath, hashPath, algorithm = 'sha256') => {
  const resolvedInput = resolvePath(currentDir, inputPath); 
  const resolvedHash = resolvePath(currentDir, hashPath);
  const supportedAlgorithms = ['sha256', 'md5', 'sha512'];

  if (!supportedAlgorithms.includes(algorithm)) {
    throw new Error('Operation failed');
  }

  try {
    const hash = crypto.createHash(algorithm);
    const readStream = fs.createReadStream(resolvedInput);
    
    await pipeline(readStream, hash);
    
    const calculatedHash = hash.digest('hex').toLowerCase();
    const expectedHash = (await fs.promises.readFile(resolvedHash, 'utf8')).trim().toLowerCase();

    if (calculatedHash === expectedHash) {
      console.log('OK');
    } else {
      console.log('MISMATCH');
    }
  } catch (error) {
    throw new Error(`Operation failed: ${error.message}`);
  }
};
