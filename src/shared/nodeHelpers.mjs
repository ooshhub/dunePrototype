// shared helper functions requiring Node imports
import fs from 'fs/promises';
import * as hbs from 'handlebars';
const handlebars = hbs.create();
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

	/*
	// HBS / HTML
	*/
	// Register Helpers
	handlebars.registerHelper('is', (val1, val2, options={doubleEquality: false}) => {
		return ((val1 === val2) || (options.doubleEquality && val1 == val2)) ? true : false;
	});
	
	// Handlebars compiler
	const compileHbs = async (inputFile, data) => {
		let file = await getFile(inputFile, false);
		if (file && /<.+>/.test(file)) {
			let compiledHtml = handlebars.compile(file)(data);
			return compiledHtml;
		} else return null;
	}

	return {
		getFile, saveFile,
		compileHbs
	}

})();