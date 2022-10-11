// Round controller
import { GameRound } from "../models/Round.mjs";
import { Helpers } from "../../../shared/Helpers.mjs";
// import { slog } from "../serverHub.mjs";

export class RoundController {

  #hidList = [];
  #dotList = [];
  #turnOrder = [];

  #rounds = [];

  #currentRound = {};
  
  constructor(ruleset, houseList, parentCore) {
    this.parentCore = parentCore;
    this.name = ruleset.name || 'defaultRounds';
    if (ruleset.custom) {
      // Custom ruleset constructor
    } else {
      this.defaultRounds.forEach((round) => {
        const newRound = new GameRound(round);
        if (newRound) this.#rounds[newRound.index??this.#rounds.length] = newRound;
      });
      // TODO: validate round indices to ensure contiguous numbers

    }
    // Grab data for PlayerTurn order
    for (let h in houseList) {
      this.#hidList.push(h);
      this.#dotList.push(houseList[h].playerDot);
    }
    // Can't remember if the storm starts at 0 or not
    this.#turnOrder = this.#determineTurnOrder(0);
  }

  defaultRounds = ['storm', 'spiceBlow', 'bidding', 'movement', 'battle', 'collection'];

  get appendFields() { return { _defaultRounds: this.defaultRounds, _hidList: this.#hidList, _dotList: this.#dotList, _rounds: this.#rounds, _currentRound: this.#currentRound } }

  get current() { return this.#currentRound }
  get dots() { return this.#dotList }
  get turnOrder() { return this.#turnOrder }
  get newTurnOrder() { this.#turnOrder = this.#determineTurnOrder; return this.turnOrder }

  // Push to next round. Probably make private method.
  async next(roundNumber) {
    const nextRoundIndex = Helpers.isBound(roundNumber, 0, this.#rounds.length) ? roundNumber : (this.#currentRound.index + 1) % this.#rounds.length;
    const endRoundCoreUpdate = this.#currentRound?.endRound?.();
    if (endRoundCoreUpdate) await this.parentCore.update('endRound', endRoundCoreUpdate);
    this.#currentRound = this.#rounds[nextRoundIndex];
    const startRoundCoreUpdate = this.#currentRound.startRound?.();
    if (startRoundCoreUpdate) await this.parentCore.update('startRound', startRoundCoreUpdate);
    // if (!this.#currentRound.playerTurns) this.next();
  }

  #determineTurnOrder(stormPosition) {
    const nearestIndex = this.#dotList.findIndex(v => v >= stormPosition);
    let playerOneIndex,
      newOrder = [];
    if (this.#dotList[nearestIndex] === stormPosition) playerOneIndex = nearestIndex;
    else {
      // If nearest Player marker is a Float, roll to see who goes first. Biased according to decimal.
      const splitRoll = Math.random();
      playerOneIndex = splitRoll > this.#dotList[nearestIndex]%1 ? nearestIndex : nearestIndex - 1;
    }
    newOrder.push(this.#hidList.splice(playerOneIndex, this.#hidList.length - playerOneIndex).concat(this.#hidList));
    return newOrder;
  }

}