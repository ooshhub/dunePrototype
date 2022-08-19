/**
 * Colour conversion functions
 */

const verifyRgb = (rgb) => {
	rgb = typeof(rgb) === 'string' ? `${rgb}`.replace(/[^\d,]/g, '').split(/,/g) : rgb;
	rgb = rgb?.map?.(x => (parseInt(x) >= 0 && parseInt(x) <= 255) ? parseInt(x) : null).filter(v=>v != null);
	return rgb?.length === 3 ? rgb : null;
}
const verifyHex = (hex) => {
	hex = `${hex}`.replace(/#/, '').toLowerCase();
	hex = hex.length === 3 ? hex.replace(/(.)/g, '$&$&') : hex.length === 6 ? hex : '';
	return /^[a-f0-9]{6}$/.test(hex) ? hex : null;
}
const verifyHsl = (hsl) => {
	hsl = typeof(hsl) === 'string' ? `${hsl}`.replace(/[^\d,]/g, '').split(/,/g) : hsl;
	const hslArray = hsl?.map((x,i) => {
		x = i===0 ? parseInt(x) : parseFloat(x);
		return ((i===0 && x>=0 && x <=360) || (x>=0 && x<=100)) ? x : null;
	}).filter(v => v != null);
	return (hslArray?.length === 3) ? hslArray : null;
}

const hexToRgb = (hex) => {
	hex = verifyHex(hex);
	if (!hex) return new Error(`hexToRgb failed: Bad hex.`);
	return hex.match(/.{2}/g).map(x => parseInt(x, 16));
}
const rgbToHex = (rgb) => {
	rgb = verifyRgb(rgb);
	if (!rgb) return new Error(`rgbToHex failed: Bad RGB`);
	const hexParts = rgb.map(x => parseInt(x)?.toString(16).padStart(2, '0') ?? '00');
	return `#${hexParts.join('')}`;
}
const rgbToHsl = (rgb) => {
	rgb = verifyRgb(rgb);
	if (!rgb) return new Error(`grbToHsl failed: Bad RGB`);
	const [r,g,b] = rgb.map(x => x/255);
	const v = Math.max(r,g,b),
				c = v-Math.min(r,g,b),
				f = (1-Math.abs(v+v-c-1));
	const h = c && ((v==r) ? (g-b)/c : ((v==g) ? 2+(b-r)/c : 4+(r-g)/c)); 
	return [Math.floor(60* (h<0 ? h+6 : h)), Math.round((f ? c/f : 0)*100), Math.round((v+v-c)/2*100)];
}
const hslToRgb = (hsl) => {
	hsl = verifyHsl(hsl);
	if (!hsl) return new Error(`hslToRgb failed: Bad HSL`);
	const [h,s,l] = hsl.map((x,i) => i===0 ? x : x/100);
	console.log(h,s,l);
	const a = s*Math.min(l, 1-l);
	const f = (n,k=(n+h/30)%12) => Math.round((l - a * Math.max(Math.min(k-3, 9-k, 1), -1))*255);
	return [f(0),f(8),f(4)];
}
const hexToHsl = (hex) => {
	const rgb = hexToRgb(hex);
	return rgb?.stack ? new Error(rgb) : rgbToHsl(rgb);
}
const hslToHex = (hsl) => {
	const rgb = hslToRgb(hsl);
	return rgb?.stack ? new Error(rgb) : rgbToHex(rgb);
}

const color = `#cc2gg4cc`;
const hsl = hexToHsl(color);
console.log(hsl);

// const rgb = hslToRgb(hsl);
// console.log(rgb);

// const hex = rgbToHex(rgb);
// console.log(hex);

export { hexToRgb, hexToHsl, rgbToHex, rgbToHsl, hslToHex, hslToRgb }