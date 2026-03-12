import path from 'path';

export const resolvePath = (currentDir, targetPath) => {
  return path.isAbsolute(targetPath) 
    ? targetPath 
    : path.resolve(currentDir, targetPath);
};
