import { readdir } from 'fs/promises';
import { CONFIG } from '../../../main.mjs';

export const createRulesetList = async () => {
	const path = `${CONFIG.PATH.CORE}/rulesets`;
	const extension = /mjs/;
	const rxValidFilename = new RegExp(`^ruleset_(.+)\\.${extension}`);
	let list = await readdir(path);
	return list.filter(filename => {
		if (rxValidFilename.test(filename)) return filename.match(rxValidFilename)[1];
	});
}