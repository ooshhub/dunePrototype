export default class HouseTransformer {
  static transform(house) {
      return {
        title: house.name,
        players: PlayerTransformer.formatPlayers(house.players)
      };
  }

  static transformFullDetails() {}

  

  static transformHouses(houses) {
    return houses.map(house => HouseTransformer.transform(house));
  }
}