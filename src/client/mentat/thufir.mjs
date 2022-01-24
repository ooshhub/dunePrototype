import { rlog, renHub } from '../rendererHub.mjs';
import { mentat } from './directory.mjs';
import { helpers } from '../../shared/helpers.mjs';
import { fetchFilePath } from '../../assets/assetDirectory.mjs';

export const MentatSystem = (() => {

	const load = ({ target, data }) => {
		if (!target || !data) return rlog(`Thufir didn't understand the request: ${target}:${data}`, 'warn');
		// rlog(`Thufir received data request for ${target}:${data}`);
		// Fetch the template for the target element
		let hbsTemplate = `mentat${helpers.emproper(target)}.hbs`;
		// Fetch the required data from the help file
		let mentatEntry = helpers.getObjectPath(mentat, data, false);
		mentatEntry = processEntry(mentatEntry);
		if (!mentatEntry) return rlog(`Error processing mentat entry.`, 'warn');
		// Send off HTML request to main process
		rlog([`Mentat request - template "${hbsTemplate}"`, mentatEntry]);
		renHub.trigger('main/requestMentatHtml', {container: target, template: hbsTemplate, data: mentatEntry});
	}

	const processEntry = (entryData) => {
		if (!entryData) return null;
		const rxTooltip = /%%[^%]+%%/g;
		// Process art directory path to filepath
		if (entryData.art) {
			for (let link in entryData.art) {
				let filePath = fetchFilePath(entryData.art[link]);
				rlog(`Resolved ${link} to ${filePath}`);
				entryData.art[link] = filePath;
			}
		}
		// Process tooltips
		if (entryData.tooltipFields?.length) {
			entryData.tooltipFields.forEach(field => {
				if (entryData[field]) {
					entryData[field].forEach(item => {
						let ttTags = `${item}`.matchAll(rxTooltip);
						for (let match of ttTags) rlog(`Found tooltip tag: ${match}`);
					});
				}
			})
		}
		return entryData;
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