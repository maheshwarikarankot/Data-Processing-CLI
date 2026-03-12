export const parseArgs = (args) => {
  const result = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key   = args[i].slice(2);   // remove '--'
      const value = args[i + 1];        // next item is the value
      result[key] = value;
    }
  }

  return result;
};