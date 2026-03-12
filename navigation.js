import fs from 'fs/promises';
import path from 'path';

export const up = async (currentDir) => {
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
        console.log('Already at the root directory');
        return currentDir;
    }
    return parentDir;
};

export const cd = async (currentDir, targetDir) => {
    const newPath = path.isAbsolute(targetDir) 
    ? targetDir : path.resolve(currentDir, targetDir);

    try{
        const stats = await fs.stat(newPath);
        if(!stats.isDirectory()){
            throw new Error('Not a directory');
        }
        return newPath; 
    }catch(err){
        throw new Error('Operation failed');
    }
};

export const ls = async (currentDir) => {
    try {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });

        const folders = [];
        const files = [];

        for (const entry of entries) {
            if(entry.isDirectory()){
                folders.push(entry.name);
            }else{
                files.push(entry.name);
            }
        }

        //sort alphabetically
        folders.sort();
        files.sort();
        
        console.log('Folders:');
        folders.forEach(folder => console.log(`  ${folder}`));
        console.log('Files:');
        files.forEach(file => console.log(`  ${file}`));
    } catch (err) {
        throw new Error('Operation failed');
    }
};
