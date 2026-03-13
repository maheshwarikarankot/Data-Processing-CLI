import os from 'os';
import { startRepl } from './repl.js';

const main = async () => {
  console.log('Welcome to Data Processing CLI!');

    const homeDir = os.homedir();
    console.log(`You are currently in ${homeDir}`);

    await startRepl(homeDir);
};
main().catch(console.error);