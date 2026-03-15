import readline from 'readline';
import { up, cd, ls } from './navigation.js';
import { parseArgs } from './utils/argParser.js';
import csvToJson from './commands/csvToJson.js';
import jsonToCsv from './commands/jsonToCsv.js';
import count from './commands/count.js';
import hash from './commands/hash.js';
import hashCompare from './commands/hashCompare.js';
import encrypt from './commands/encrypt.js';
import decrypt from './commands/decrypt.js';
import logStats from './commands/logStats.js';



export const startRepl = async (initialCwd) => {
    let currentDir = initialCwd;

  const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '>',
});

const printCurrentDirectory = () => {
    console.log(`You are currently in ${currentDir}`);
};

const handledCommand = async (line) => {
    const trimmedLine = line.trim();

    if(!trimmedLine) {
        return;
    } 
    if (trimmedLine === '.exit') {
        rl.close();
        process.exit(0);
    }

      // Handle Ctrl+C
    process.on('SIGINT', () => {
    console.log('\nThank you for using Data Processing CLI!');
    process.exit(0);
  });

    const userInput = trimmedLine.split(/\s+/);
    const command = userInput[0];
    const args = userInput.slice(1);

    try {
      switch (command) {
        case 'up':
          currentDir = await up(currentDir);
          printCurrentDirectory();
          break;

        case 'cd':
          if (args.length === 0) {
            console.log('Invalid input');
            break;
          }
          currentDir = await cd(currentDir, args[0]);
          printCurrentDirectory();
          break;

        case 'ls':
          await ls(currentDir);
          printCurrentDirectory();
          break;

        case 'csv-to-json':
          {
            const parsed = parseArgs(args);
            if (!parsed.input || !parsed.output) {
              console.log('Invalid input');
              break;
            }
            await csvToJson(currentDir, parsed.input, parsed.output);
            printCurrentDirectory();
          }
          break;

        case 'json-to-csv':
          {
            const parsed = parseArgs(args);
            if (!parsed.input || !parsed.output) {
              console.log('Invalid input');
              break;
            }
            await jsonToCsv(currentDir, parsed.input, parsed.output);
            printCurrentDirectory();
          }
          break;

        case 'count':
          {
            const parsed = parseArgs(args);
            if (!parsed.input) {
              console.log('Invalid input');
              break;
            }
            await count(currentDir, parsed.input);
            printCurrentDirectory();
          }
          break;

        case 'hash':
          {
            const parsed = parseArgs(args);
            if (!parsed.input) {
              console.log('Invalid input');
              break;
            }
            await hash(currentDir, parsed.input, parsed.algorithm, parsed.save);
            printCurrentDirectory();
          }
          break;

        case 'hash-compare':
          {            
            const parsed = parseArgs(args);
            if (!parsed.input || !parsed.hash) {
              console.log('Invalid input');
              break;
            }
            await hashCompare(currentDir, parsed.input, parsed.hash, parsed.algorithm);
            printCurrentDirectory();
          }
          break;

        case 'encrypt':
          {
            const parsed = parseArgs(args);
            if (!parsed.input || !parsed.output || !parsed.password) {
              console.log('Invalid input');
              break;
            }
            await encrypt(currentDir, parsed.input, parsed.output, parsed.password);
            printCurrentDirectory();
          }
          break;

        case 'decrypt':
          {
            const parsed = parseArgs(args);
            if (!parsed.input || !parsed.output || !parsed.password) {
              console.log('Invalid input');
              break;
            }
            await decrypt(currentDir, parsed.input, parsed.output, parsed.password);
            printCurrentDirectory();
          }
          break;

        case 'log-stats':
          {
            const parsed = parseArgs(args);
            if (!parsed.input || !parsed.output) {
              console.log('Invalid input');
              break;
            }
            await logStats(currentDir, parsed.input, parsed.output);
            printCurrentDirectory();
          }
          break;

        default:
          console.log('Invalid input');
      }
    } catch (error) {
      console.log('Operation failed:', error.message);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
    }
  };

  rl.prompt();

  rl.on('line', async (line) => {
    await handledCommand(line);
    rl.prompt();
  });

  rl.on('close', () => {
    console.log('Thank you for using Data Processing CLI!');
    process.exit(0);
  });
};
