export const parseArgs = (args) => {
  const result = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);   // remove '--'
      
      // Check if next arg exists and doesn't start with '--'
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        result[key] = args[i + 1];
        i++; // Skip the value
      } else {
        // Boolean flag (no value)
        result[key] = true;
      }
    }
  }

  return result;
};