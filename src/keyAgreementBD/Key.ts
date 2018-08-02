export class Key {
  public initiatorId: number
  public initiatorCounter: number
  public value: CryptoKey

  constructor(key: CryptoKey, initiatorId: number, initiatorCounter: number) {
    this.value = key
    this.initiatorId = initiatorId
    this.initiatorCounter = initiatorCounter
  }

  isEqual(initiatorId: number, initiatorCounter: number): boolean {
    return this.initiatorId === initiatorId && this.initiatorCounter === initiatorCounter
  }
}
