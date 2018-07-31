import { symmetricCrypto } from 'crypto-api-wrapper'

import { KeyStatus } from './KeyStatus'

export class SymmetricCrypto {
  public status: KeyStatus
  private key: CryptoKey | undefined

  constructor() {
    this.key = undefined
    this.status = KeyStatus.UNDEFINED
  }

  async generateKey(): Promise<string> {
    this.key = await symmetricCrypto.generateEncryptionKey()
    const jsonWebKey = await symmetricCrypto.exportKey(this.key)
    return symmetricCrypto.toB64(jsonWebKey)
  }

  async importKey(key: string): Promise<void> {
    this.key = await symmetricCrypto.importKey(symmetricCrypto.fromB64(key))
    this.status = KeyStatus.READY
  }

  async encrypt(msg: Uint8Array): Promise<Uint8Array> {
    if (this.key && this.status === KeyStatus.READY) {
      return symmetricCrypto.encrypt(msg, this.key)
    }
    throw new Error('Cryptographic key is not ready yet.')
  }

  async decrypt(ciphertext: Uint8Array): Promise<Uint8Array> {
    if (this.key && this.status === KeyStatus.READY) {
      return symmetricCrypto.decrypt(ciphertext, this.key)
    }
    throw new Error('Cryptographic key is not ready yet.')
  }
}
