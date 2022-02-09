import { rlog, renHub } from '../rendererHub.mjs';
import { helpers } from '../../shared/helpers.mjs';
import { fetchFilePath } from '../../assets/assetDirectory.mjs';
import { ttIndex } from './tooltips.mjs';

export const MentatSystem = (() => {

	const load = ({ target, data }) => {
		if (!target || !data) return rlog(`Thufir didn't understand the request: ${target}:${data}`, 'warn');
		rlog([`Thufir received data request for ${target}`,data]);
		// Fetch the template for the target element
		let hbsTemplate = `mentat${helpers.emproper(target)}.hbs`;
		// Fetch the required data from the help file
		let houseData = window.Dune.Houses?.[data];
		if (!houseData) return rlog(`No house found`, 'warn');
		let mentatEntry = processEntry(houseData) ?? null;
		if (!mentatEntry) return rlog(`Error processing mentat entry.`, 'warn');
		// Send off HTML request to main process
		// rlog([`Mentat request - template "${hbsTemplate}"`, mentatEntry]);
		renHub.trigger('main/requestMentatHtml', {container: target, template: hbsTemplate, data: mentatEntry});
	}

	const processEntry = (entryData) => {
		if (!entryData) return null;
		let output = { title: entryData.title, description: entryData.mentat.description, abilities: `House Abilities:\n` };
		// Process art directory path to filepath
		if (entryData.mentat?.art) {
			for (let link in entryData.art) {
				let filePath = fetchFilePath(entryData.art[link]);
				// rlog(`Resolved ${entryData.art[link]} to ${filePath}`);
				output.art[link] = filePath;
			}
		}
		// Process stats;
		let placed = entryData.stats?.startingPosition?.placed || {};
		let statsDescription = `Total Soldiers: ${entryData.stats.soldiers}`;
		for (let startPos in placed) {
			statsDescription += ` (${placed[startPos]} in ${startPos})`;
		}
		if (entryData.stats?.eliteSoldiers) statsDescription += `Elite Soldiers: ${entryData.stats?.eliteSoldiers}`;
		statsDescription += `\nStarting Movement: ${entryData.stats?.startingPosition?.movement??1} region(s)\nStarting Spice: ${entryData.stats?.startingSpice??0}\nFree Revival: ${entryData.stats?.freeRevival??1} token(s) per turn`;
		// Process Abilities
		let abilityTitle;
		let abilityDescription = entryData.abilities.map((ab, i) => {
			let output = '';
			if (abilityTitle !== ab.name) {
				abilityTitle = ab.name;
				output += `${ab.name}:\n`;
			}
			output +=`${i+1}. ${ab.description}`;
			return output;
		});
		// Add tooltips
		abilityDescription = abilityDescription.join('\n');
		abilityDescription = addTooltips(abilityDescription);
		output.description += `\n${statsDescription}`;
		output.abilities += abilityDescription;
		// Resolve filenames
		output.art = {
			portrait: fetchFilePath(entryData.mentat?.art?.portrait),
			background: fetchFilePath(entryData.mentat?.art?.background)
		}
		return output;
	}

	const addTooltips = (inputString) => {
		const rxTooltip = /%%[^%]+%%/g;
		let ttMatches = [...`${inputString}`.matchAll(rxTooltip)];
		rlog([`tooltip matches: `,ttMatches.join(', ')]);
		ttMatches.forEach((tt) => {
			// rlog(tt[0]);
			// rlog(`${i} - ${tt[0]}`);
			const parts = tt[0]?.replace(/%/g, '').split(/\|/) || [];
			if (parts.length === 2) {
				const tip = ttIndex[parts[1]] ? ttIndex[parts[1]] : ttIndex.default;
				const label = parts[0];
				// rlog(`Replacing ${tt[0]} with [${label}](${tip})`);
				const html = `<div class="tt-target tt-mentat">
												<span>${label}</span>
												<div class="tt-content tt-mentat">${tip}</div>
											</div>`;
				inputString = inputString.replace(tt[0], html);
			}
		});
		return inputString;
	}

	const append = ({ target, html }) => {
		let container = $(`#mentat-${target} .mentat-container`);
		if (container && html) {
			container.innerHTML = html;
			renHub.trigger('showElement', `#mentat-${target}`);
		}
		else rlog([`Error in Mentat html`, container, html]);
	}

	return { load, append }

})();