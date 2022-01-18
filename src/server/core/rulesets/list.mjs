import { readdir } from 'fs/promises';
import { CONFIG } from '../../../main.mjs';

export const fetchRulesets = async () => {
	const path = `${CONFIG.PATH.CORE}/rulesets`;
	const extension = 'mjs';
	const rxValidFilename = new RegExp(`^ruleset_(.+)\\.${extension}$`);
	let list = await readdir(path);
	console.log(list);
	list = list.map(filename => {
		if (rxValidFilename.test(filename)) return filename.match(rxValidFilename)[1];
	}).filter(v=>v);
	return list;
}

export const loadRuleset = async () => {
	// do stuff
}