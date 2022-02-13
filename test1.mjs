const camelise = (inp, options={enforceCase:true}) => {
	if (typeof(inp) !== 'string') return;
	const words = inp.split(/[\s_]+/g);
	return words.map((w,i) => {
		const wPre = i > 0 ? w[0].toUpperCase() : w[0].toLowerCase();
		const wSuf = options.enforceCase ? w.slice(1).toLowerCase() : w.slice(1);
		return `${wPre}${wSuf}`;
	}).join('');
}

const deCamelise = (inp, options={includeNumerals:true}) => {
	if (typeof(inp) !== 'string') return;
	const rxJoins = options.includeNumerals ? /([\w])([A-Z0-9])/g : /([\w])([A-Z])/g ;
	let arr, output = inp;
	while ((arr = rxJoins.exec(inp))?.[0]) {
		output = output.replace(arr[0], `${arr[1]} ${arr[2]}`);
		rxJoins.lastIndex -= 1;
	}
	return output;
}

const str = `deCamelCaseAThing`;

console.log(deCamelise(str));