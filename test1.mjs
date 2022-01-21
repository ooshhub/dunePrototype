/* globals log on playerIsGM, state, sendChat, libInline */
const unWhisper = (() => { //eslint-disable-line no-unused-vars

	const scriptName = 'unWhisper';
	const version = {
		M: 0,
		m: 1,
		p: 0,
		get: function() { return `${this.M}.${this.m}.${this.p}` },
		getFloat: function() { return parseFloat(`${this.M}.${this.m}${this.p}`) }
	}
	
	const config = {
		maxWhispers: 5,
		maxPreviewSize: 20,
	}

	const init = () => {
		if (!state.unWhisper || !state.unWhisper.version) {
			state.unWhisper = {
				version: version.getFloat(),
				whispers: [],
				config: config,
			}
		} else if (state.unWhisper.version < version.getFloat()) {
			// update version
		}
		refreshConfig();
		on('chat:message', handleInput);
		log(`- Initialised ${scriptName} - v${version.get()} -`);
		setTimeout(() => { if (!/object/i.test(typeof(libInline))) return sendChat(scriptName, `/w gm <div style="color: red; font-weight: bold">libInline was not found: Please install from one-click library to enable inline rolls!</div>`), 250 });
	}

	const refreshConfig = () => Object.assign(config, state.unWhisper.config);

	const filterPreview = (inputStr) => {
		let output = `${inputStr}`.replace(/[{}[\]@]/g, '');
		return output;
	}

	const listWhispers = () => {
		const headStyle = `background-color: black; color: white; font-weight:bold; border:2px solid black; width: 100%; word-break: break-all; line-height: 2em;`
		const rowStyle = `background: white; color: black; font-weight: normal; padding: 5px 2px 5px 2px; line-height: 2rem; word-break: break-all`
		const buttonStyle = `background-color: darkblue; border: 1px darkblue solid; padding: 2px 5px 2px 5px; border-radius:3px; color: white; font-weight: bold; `
		let previews = state.unWhisper.whispers.map(w => w.preview||'no preivew'),
				templateHead = `<div style="${headStyle}">&nbsp;&nbsp;&nbsp;unWhisper`,
				templateBody = [],
				templateFoot = `</div>`
		for (let i = previews.length-1; i >= 0; i--) { templateBody.push(`<div style="${rowStyle}"><a href="!unWhisper --${i}" style="${buttonStyle}">Msg ${i}</a> ${previews[i]}</div>`); }//(`{{[Msg ${i}](\`!unWhisper --${i}" style="${buttonStyle})=${previews[i]}}}`); }
		sendChat(scriptName, `${templateHead}${templateBody.join(' ')}${templateFoot}`);
	}

	const storeWhisper = (whisper) => {
		let store = state.unWhisper.whispers,
				header = whisper.rolltemplate ? `\*\*${whisper.rolltemplate}\*\*/` : `\*\*-\*\*/`, // eslint-disable-line no-useless-escape
				nameMatch = whisper.content.match(/name=([^}]+?)}/);
		header += nameMatch ? nameMatch[1] : whisper.content.slice(0, config.maxPreviewSize);
		store.unshift({ preview: filterPreview(header), msg: whisper });
		while (store.length > config.maxWhispers) { store.pop(); }
	}

	const sendWhisper = (index = 0) => {
		let whisper = state.unWhisper.whispers[index];
		if (!whisper || !whisper.msg) return log(`unWhisper: bad index "${index}"`);
		let templatePrefix = whisper.msg.rolltemplate ? `&{template:${whisper.msg.rolltemplate}} ` : '';
		let newContent = `${templatePrefix}${whisper.msg.content}`;
		if (whisper.msg.inlinerolls && whisper.msg.inlinerolls.length) {
			let rolls = libInline.getRollData(whisper.msg.inlinerolls);
			newContent = newContent.replace(/\$\[\[(\d+)]]/g, ((m, p1) => rolls[p1].getRollTip()));
		}
		sendChat(scriptName, newContent);
	}

	const handleInput = (msg) => {
		if (!playerIsGM(msg.playerid)) return;
		if (msg.type === 'api' && /^!unwhisper/i.test(msg.content)) {
			let line = (msg.content.match(/^!unwhisper\s+(.+)/i) || [])[1];
			if (!line) sendWhisper(0);
			else {
				let params = line.split(/\s*--\s*/g);
				params.shift();
				params.forEach(param => {
					let cmd = (param.match(/^([^\s]+?)(\s|$)/)||[])[1],
							args = (param.match(/\s+(.+)/)||[])[1],
							change;
					if (!cmd) return;
					if (/maxwhisp/i.test(cmd)) {
						let newMax = args.replace(/\D/g, '');
						if (newMax > 0 && newMax < 30) {
							state.unWhisper.config.maxWhispers = newMax;
							change = `new maxWhispers: ${newMax}`;
						}
					}
					else if (/maxprev/i.test(cmd)) {
						let newMax = args.replace(/\D/g, '');
						if (newMax > 0 && newMax < 50) {
							state.unWhisper.config.maxPreviewSize = newMax;
							change = `new maxPreview: ${newMax}`;
						}
					}
					else if (/list/i.test(cmd)) {
						listWhispers();
					}
					else if (/^\d+/.test(cmd)) {
						let index = cmd.replace(/\D/g, '');
						sendWhisper(index);
					}
					else sendChat(scriptName, `/w gm Unrecognised command: "${cmd}"`);
					if (change) {
						sendChat(scriptName, `/w gm Setting change: ${change}`);
						refreshConfig();
					}
				});
			}
		} else if (msg.target && (/^gm$/i.test(msg.target) || playerIsGM(msg.target)) && playerIsGM(msg.playerid)) {
			storeWhisper(msg);
		}
	};

	on('ready', () => init() );

})();