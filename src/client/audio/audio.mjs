/* globals Howl, */
// Handle audio requests
await import('./lib/howler.js');
const renHub = window.Dune.RenHub;
// const rlog = window.Dune.Helpers.rlog;
const audioPath = `${window.Dune?.CONFIG?.PATH?.ROOT}/assets/audio`;

export const initAudio = async () => {
	if (!Howl || !renHub || !audioPath) return new Error('Failed to initialise Howler audio');
	let titleMusic = new Howl({
		src: `${audioPath}/music/prophecyTheme.mp4`,
		preload: true
	});
	titleMusic.play();
}