import fs, { createReadStream, createWriteStream } from 'node:fs';
import { Transform } from 'stream';   
import { resolvePath } from '../utils/pathResolver.js';

export default async (currentDir, inputPath, outputPath) => {
  const resolvedInput = resolvePath(currentDir, inputPath);
  const resolvedOutput = resolvePath(currentDir, outputPath);


  if (!fs.existsSync(resolvedInput)) {
    throw new Error('Operation failed');
  }

  await new Promise((resolve, reject) => {

    let headers  = [];
    let result     = [];
    let leftover = ''; // holds incomplete line between chunks


    const readStream = createReadStream(resolvedInput, 'utf8');

    //converts CSV chunks into JSON objects
    const csvToJson = new Transform({

      transform(chunk, encoding, callback) {
        const text  = leftover + chunk.toString();
        const lines = text.split('\n');

        // Save last incomplete line for next chunk
        leftover = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue; 

          if (headers.length === 0) {
            // First line → extract headers
            headers = line.split(',').map(h => h.trim());
          } else {
            // Remaining lines → build objects
            const values = line.split(',').map(v => v.trim());
            const obj    = {};
            headers.forEach((header, index) => {
              obj[header] = values[index] || '';
            });
            result.push(obj);
          }
        }
        callback();
      },

      flush(callback) {
        // Handle last remaining line
        if (leftover.trim()) {
          const values = leftover.split(',').map(v => v.trim());
          const obj    = {};
          headers.forEach((header, index) => {
            obj[header] = values[index] || '';
          });
          result.push(obj);
        }
        // Push the final JSON array downstream
        this.push(JSON.stringify(result, null, 2));
        callback();
      }
    });

    const writeStream = createWriteStream(resolvedOutput);

    writeStream.on('finish', () => {
      resolve();
    });

    writeStream.on('error', reject);
    readStream.on('error', reject);
    csvToJson.on('error', reject);

    readStream.pipe(csvToJson).pipe(writeStream);

  });
};
  // try {
  //   const csvData = await fs.readFile(resolvedInput, 'utf8');
  //   const lines = csvData.split('\n').trim();
    
  //   if (lines.length === 0) {
  //     throw new Error('CSV file is empty');
  //   }

  //   const headers = lines[0].split(',').trim();
  //   const jsonData = lines.slice(1).map(line => {
  //     const values = line.split(',').trim();
  //     const obj = {};
  //     headers.forEach((header, index) => {
  //       obj[header] = values[index] || '';
  //     });
  //     return obj;
  //   });

  //   await fs.writeFile(resolvedOutput, JSON.stringify(jsonData, null, 2));
  //   console.log('CSV to JSON conversion successful');
  // } catch (error) {
  //   throw error;
  // }
