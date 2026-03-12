import os from 'os';
import { startRepl } from './repl.js';

const main = async () => {
  console.log('Welcome to Data Processing CLI!');

    //set initial working directory to user's home directory
    const homeDir = os.homedir();
    console.log(`You are currently in ${homeDir}`);

    // start the REPL with the hone directory
    await startRepl(homeDir);
};
main().catch(console.error);