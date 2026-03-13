import fs from 'fs/promises';
import { resolvePath } from '../utils/pathResolver.js';

export default async (currentDir, inputPath, outputPath) => {
  const resolvedInput = resolvePath(currentDir, inputPath);
  const resolvedOutput = resolvePath(currentDir, outputPath);

  try {
    const jsonData = await fs.readFile(resolvedInput, 'utf8');
    const data = JSON.parse(jsonData);

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid JSON format');
    }

    const headers = Object.keys(data[0]);
    const csvLines = [headers.join(',')];

    for (const obj of data) {
      const values = headers.map(header => obj[header] || '');
      csvLines.push(values.join(','));
    }

    await fs.writeFile(resolvedOutput, csvLines.join('\n'), 'utf-8');
    console.log('JSON to CSV conversion successful');
  } catch (error) {
    throw new Error(`Operation failed: ${error.message}`);
  }
};
