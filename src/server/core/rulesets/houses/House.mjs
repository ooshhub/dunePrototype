export class House {

	constructor(houseData) {
		let newData = {
			name: houseData.name || 'NewCunts',
			title: houseData.title || 'House NewCunts',
			defaultColor: houseData.defaultColor || '#ffffff',
			ruler: {
				name: houseData.ruler?.name || 'Cunty McLeader',
				avatar: houseData.ruler?.avatar || 'default/leader'
			},
			stats: houseData.stats ?? {},
			abilities: houseData.abilities ?? [],
			alliance: houseData.alliance ?? [],
			advanced: houseData.advanced ?? {},
			description: houseData.description || null,
			mentat: houseData.mentat ?? {},
		}
		Object.assign(this, newData);
	}

}