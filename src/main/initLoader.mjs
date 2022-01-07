export const initConfig = async (electronApp) => {
	let rootPath = electronApp?.getAppPath();
	if (!rootPath) return new Error(`initConfig error: no root path to Electron found.`);
	const CONFIG = {
		NET: {
			PUBLIC_IP: "",
		},
		PATH: {
			ROOT: rootPath,
			USERDATA: `${rootPath}/config`, // change to electron.app.getPath('userData') later
			SAVEGAME: `${rootPath}/saves`,
			HTML: `${rootPath}/client/templates`,
			HBS: `${rootPath}/client/templates/hbs`,
		},
		DEBUG: 0
	};
	return CONFIG;
}

export const getUserSettings = async () => {}

export const getPublicIp = async () => {}