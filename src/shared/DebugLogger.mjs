// Create a new event-based logger. 
//		sourceName: provide a name to prefix console messages with. Must match a debugStyle in the receiver, or default will be used.
//		eventHubLink: a reference to the nearest eventHub to route the console logs through
// 		receiverHub: the name of the target eventHub which will receive the logs. Defaults to 'renderer'
// 		debugFlagLink: reference to a config flag to switch logging on and off.
// 		logToConsole: whether to also log directly to console.log()
export class DebugLogger {
	constructor(sourceName, eventHubLink, debugFlagLink = 1, logToConsole = 0, receiverHub = 'renderer') {
		return async (msgs, style='log') => {
			if (!console[style] || debugFlagLink === 0) return;
			msgs = Array.isArray(msgs) ? msgs : [msgs];
			eventHubLink.trigger(`${receiverHub}/${sourceName}Log`, {msgs: msgs, style: style});
			if (logToConsole) console[style](...msgs);
		};
	}
}

// Receiver for remote loggers. Lives on the rendererHub for dunePrototype.
// 		eventHubLink: local event hub which will be receiving remote logs
// 		sources: object containing key value pairs with source name and a truthy or falsy value.
// 				eg { example: 1 } would register for logs with the eventname 'exampleLog'
// 				value is checked at time of Event, so passing a reference to a live object allows live toggling without removing handler
// 		styles: provide custom styles. Shouldn't be needed for Dune, just use defaults
export class DebugReceiver {
	#duneDefaultStyles = {
		main: 'background: yellow; color: black; padding:1px 5px 1px 5px; border-radius: 3px',
		server: 'background: purple; color: white; padding:1px 5px 1px 5px; border-radius: 3px',
		socket: 'background: darkblue; color: white; padding:1px 5px 1px 5px; border-radius: 3px',
		clientSockets: 'background: green; color: black; padding:1px 5px 1px 5px; border-radius: 3px', 
		renderer: 'background: orange; color: black; padding:1px 5px 1px 5px; border-radius: 3px',
		default: 'background: darkgreen; color: black; padding:1px 5px 1px 5px; border-radius: 3px',
	}
	#registeredHandlers = [];
	#logStyles = {};
	#logSources = {};
	#hubReference = null;

	#processLog(logSource, { msgs, style } ) {
		if (this.#logSources[logSource]) {
			(console[style]||console.log)(`%cFrom ${logSource}:`, this.#logStyles[logSource]||this.#logStyles.default||'', ...msgs);
		}
	}

	constructor(eventHubLink, sources = {}, styles) {
		this.#logStyles = typeof(styles?.default) === 'string' ? styles : this.#duneDefaultStyles;
		this.#hubReference = eventHubLink;
		this.#logSources = sources;
		// this.#registerHandlers();
	}
	registerHandlers() {
		for (let src in this.#logSources) {
			if (this.#logSources[src]) {
				if (this.#hubReference.on) {
					this.#hubReference.on(`${src}Log`, (msgData) => this.#processLog(src, msgData));
					this.#registeredHandlers.push(`${this.#hubReference.name}||${src}Log`);
				}
			}
		}
	}
	listHandlers() { return this.#registeredHandlers||[] }
	// If ever required, can add methods to add or remove handlers.
}