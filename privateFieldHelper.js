const privates = `
	#houses = {};
	#players = {};
	#session = null;
	#config = null;
	#eventHub = null;
`

let rejig = privates
	.replace(/\s*\n\s*/g, '')
	.replace(/\s*(=|:)[^;]*;/g, ', ')
	// .replace(/\s*;\s*/, ', ')
	.replace(/#(\w+)/g, '_$1: this.#$1')
	.trim();

const copyToCB = (str) => {require('child_process').spawn('clip').stdin.end(str);}

copyToCB(rejig);

