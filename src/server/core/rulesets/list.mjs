import { readdir } from 'fs/promises';
import { CONFIG } from '../../../main.mjs';

const extension = 'mjs';

export const fetchRulesets = async () => {
	const path = `${CONFIG.PATH.CORE}/rulesets`;
	const rxValidFilename = new RegExp(`^ruleset_(.+)\\.${extension}$`);
	let list = await readdir(path);
	list = list.map(filename => {
		if (rxValidFilename.test(filename)) return filename.match(rxValidFilename)[1];
	}).filter(v=>v);
	return list;
}

export const loadRuleset = async (setName) => {
	let fileName = `ruleset_${setName}.${extension}`;
	let ruleset;
	try { ({ ruleset } = await import(`./${fileName}`)) } catch(e) { console.log(e) }
	return ruleset ? await ruleset() : null;
}