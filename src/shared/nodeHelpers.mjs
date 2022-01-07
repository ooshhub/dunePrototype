// shared helper functions requiring Node imports
import fs from 'fs/promises';
import { helpers as browserHelpers } from './helpers.mjs';

export const helpers = (() => {

	/* 
	// FILE SYSTEM
	*/
	// Generic file load
	const getFile = async (filePath, json=true) => { // move to helpers later
    let output = null;
    let file = await fs.readFile(filePath, 'utf-8')
      .catch(() => console.warn(`File not found ${filePath}`));
    if (file && json) {
      try { output = JSON.parse(file) } catch(e) { console.error(`Couldn't read file.`)}
    } else output = file;
    return output;
  }
  const saveFile = async (filePath, data, timer=10000) => {
    let result = await Promise.race([
      fs.writeFile(filePath, data),
      browserHelpers.timeout(timer)
    ]);
    return result===undefined ? true : false;
  }

	return { getFile, saveFile }

})();