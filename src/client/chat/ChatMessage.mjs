import { helpers } from '../../shared/helpers.mjs';

/* TEST DATA */
// const players = {
// 	p1: {
// 		name: 'alice o',
// 		pid: 'a1'
// 	},
// 	p2: {
// 		name: 'bob',
// 		pid: 'b2',
// 	},
// 	p3: {
// 		name: 'alice b',
// 		pid: 'a3'
// 	}
// }

// const activePlayer = {
// 	lastWhisper: 'b2'
// }

export class ChatMessage {

	constructor(msg) {

		const players = window.Dune.players;
		const activePlayer = window.Dune.currentPlayer;

		this.type = null;
		this.content = '';
		if (!msg || typeof msg !== 'string') return;
		msg = msg.trim();
		let command = (msg.match(/^\/([^\s]+)/)||[])[1];
		if (command) {
			msg = msg.replace(/^\/[^\s]+?\s*/, '');
			switch(command.toLowerCase()) {
				// handle whisper
				case 'w': {
					const whisperTarget = (msg.match(/^("[^"]+?"|[^\s]+)/)||[])[1];
					if (whisperTarget) {
						const rxTarget = new RegExp(helpers.escapeRegex(whisperTarget.replace(/"/g, '')), 'i');
						for (let p in players) { if (rxTarget.test(players[p].playerName)) this.target = p; }
					}
					if (!this.target) {
						this.type = 'error';
						this.content = `Error: Could not find player "${whisperTarget.replace(/"/g, '')}".`;
						this.from = 'system';
					} else {
						this.content = msg.replace(whisperTarget, '').trim();
						this.type = this.target === activePlayer.pid ? 'whisper-self' : 'whisper';
					}
					break;
				}
				// handle reply whisper
				case 'r': {
					const replyTarget = activePlayer.lastWhisper;
					if (!replyTarget || !players[replyTarget]) {
						this.type = 'error';
						this.content = `Error: Could not find reply target: "${replyTarget||'Null'}"`;
						this.from = 'system';
					} else {
						this.type = 'whisper';
						this.target = replyTarget;
						this.content = msg;
					}
					break;
				}
				// other commands...
				default:
					this.type = 'error';
					this.from = 'system';
					this.content = `Error: unrecognised command "/${command}"`;
			}
		} else {
			this.type = 'general';
			this.content = msg;
		}
	}
}

/* Return new Model class if required later */

// class ChatMessageModel {
// 	constructor(parsedData) {
// 		Object.assign(this, parsedData);
// 	}
// }