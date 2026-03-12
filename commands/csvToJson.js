import fs from 'fs/promises';
import { resolvePath } from '../utils/pathResolver.js';

export default async (currentDir, inputPath, outputPath) => {
  const resolvedInput = resolvePath(currentDir, inputPath);
  const resolvedOutput = resolvePath(currentDir, outputPath);

  try {
    const csvData = await fs.readFile(resolvedInput, 'utf8');
    const lines = csvData.split('\n').trim();
    
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    const headers = lines[0].split(',').trim();
    const jsonData = lines.slice(1).map(line => {
      const values = line.split(',').trim();
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });

    await fs.writeFile(resolvedOutput, JSON.stringify(jsonData, null, 2));
    console.log('CSV to JSON conversion successful');
  } catch (error) {
    throw error;
  }
};