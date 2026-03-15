import fs from "fs";
import crypto from "crypto";
import { resolvePath } from "../utils/pathResolver.js";

export default async (currentDir, inputPath, outputPath, password) => {
  const resolvedInput = resolvePath(currentDir, inputPath);
  const resolvedOutput = resolvePath(currentDir, outputPath);


  if (!fs.existsSync(resolvedInput)) {
    console.log("Operation failed");
    return;
  }

  await new Promise((resolve, reject) => {

    //Read salt + iv from first 28 bytes
    const fileSize = fs.statSync(resolvedInput).size;
    const fd = fs.openSync(resolvedInput, "r");

    const header = Buffer.alloc(28);
    fs.readSync(fd, header, 0, 28, 0); //read 28 bytes at position 0

    const salt = header.subarray(0, 16); //first 16 bytes
    const iv = header.subarray(16, 28); //next  12 bytes 

    //Read authTag from last 16 bytes
    const authTag = Buffer.alloc(16);
    fs.readSync(fd, authTag, 0, 16, fileSize - 16); //read 16 bytes from end

    fs.closeSync(fd);

    // Derive 32-byte key using scrypt with password + salt
    crypto.scrypt(password, salt, 32, (err, key) => {
      if (err) {
        console.log("Operation failed");
        return resolve();
      }

      const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);

      decipher.setAuthTag(authTag);

      // Read only ciphertext — skip first 28 bytes and last 16 bytes
      const readStream = fs.createReadStream(resolvedInput, {
        start: 28, // skip salt(16) + iv(12)
        end: fileSize - 17, // skip authTag(16) at end
      });

      const writeStream = fs.createWriteStream(resolvedOutput);

      readStream.pipe(decipher).pipe(writeStream);

      writeStream.on("finish", () => {
        resolve();
      });

      decipher.on("error", () => {
        console.log("Operation failed");
        if (fs.existsSync(resolvedOutput)) {
          fs.unlinkSync(resolvedOutput);
        }
        resolve();
      });

      readStream.on("error", () => {
        console.log("Operation failed");
        resolve();
      });
      writeStream.on("error", () => {
        console.log("Operation failed");
        resolve();
      });
    });
  });
};
