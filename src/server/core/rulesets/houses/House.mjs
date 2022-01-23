export class House {

	constructor(houseData) {
		let newData = {
			name: houseData.name || 'New House',
			leader: {
				name: houseData.leader?.name || 'LeaderMan',
				avatar: houseData.leader?.avatar || 'defaultLeader.png'
			},
			defaultColor: houseData.defaultColor || '#ffffff',
			abilities: [],
			description: houseData.description || null,
			mentat: houseData.mentat ?? null,
		}
		Object.assign(this, newData);
	}

}