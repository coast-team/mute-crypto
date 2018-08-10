import { symmetricCrypto } from '@coast-team/mute-crypto-helper'

import { KeyState } from '../KeyState'
import { MuteCrypto } from '../MuteCrypto'

export class Symmetric extends MuteCrypto {
  private key: CryptoKey | undefined

  constructor() {
    super()
    this.key = undefined
  }
  async importKey(key: string): Promise<void> {
    this.key = await symmetricCrypto.importKey(symmetricCrypto.fromB64(key))
    super.setState(KeyState.READY)
  }

  async encrypt(msg: Uint8Array): Promise<Uint8Array> {
    if (this.key) {
      return symmetricCrypto.encrypt(msg, this.key)
    }
    throw new Error('Cryptographic key is not ready yet.')
  }

  async decrypt(ciphertext: Uint8Array): Promise<Uint8Array> {
    if (this.key) {
      return symmetricCrypto.decrypt(ciphertext, this.key)
    }
    throw new Error('Cryptographic key is not ready yet.')
  }
}
