import fs from 'fs';
import crypto from 'crypto';
import { resolvePath } from '../utils/pathResolver.js';

export default async (currentDir, inputPath, outputPath, password) => {
  const resolvedInput  = resolvePath(currentDir, inputPath);
  const resolvedOutput = resolvePath(currentDir, outputPath);


  if (!fs.existsSync(resolvedInput)) {
    console.log('Operation failed');
    return;
  }

  if (!inputPath || !outputPath || !password) {
    console.log('Invalid input');
    return;
  }

  await new Promise((resolve, reject) => {

    const salt = crypto.randomBytes(16);
    const iv   = crypto.randomBytes(12);

    //Derive 32-byte key from password + salt using scrypt which is a password-based key derivation function
    crypto.scrypt(password, salt, 32, (err, key) => {
      if (err) return reject(err);

      //Create AES-256-GCM cipher 
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

      const readStream  = fs.createReadStream(resolvedInput);
      const writeStream = fs.createWriteStream(resolvedOutput);

      //Write header first — salt(16) + iv(12)
      writeStream.write(Buffer.concat([salt, iv]));

      // file.txt → readStream → cipher(encrypt) → writeStream → file.txt.enc
      readStream.pipe(cipher).pipe(writeStream, { end: false });

      //After encryption finishes,write authTag
      cipher.on('end', () => {
        const authTag = cipher.getAuthTag();
        writeStream.end(authTag); 
      });

      writeStream.on('finish', () => {
        resolve();
      });

      readStream.on('error',  reject);
      writeStream.on('error', reject);
      cipher.on('error',      reject);
    });
  });
};
