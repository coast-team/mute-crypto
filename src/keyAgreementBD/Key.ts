export class Key {
  public id: KeyId
  public value: CryptoKey

  constructor(key: CryptoKey, keyId: KeyId) {
    this.value = key
    this.id = keyId
  }
}

export interface KeyId {
  id: number
  counter: number
}
