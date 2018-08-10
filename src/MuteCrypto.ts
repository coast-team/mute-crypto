import { symmetricCrypto } from '@coast-team/mute-crypto-helper'
import { log } from './debug'
import { KeyState } from './KeyState'

export abstract class MuteCrypto {
  public static async generateKey(): Promise<string> {
    const key = await symmetricCrypto.generateEncryptionKey()
    const jsonWebKey = await symmetricCrypto.exportKey(key)
    return symmetricCrypto.toB64(jsonWebKey)
  }

  public state: KeyState
  public onStateChange: (state: KeyState) => void

  constructor() {
    this.onStateChange = () => {}
    this.state = KeyState.UNDEFINED
  }

  abstract async encrypt(msg: Uint8Array): Promise<Uint8Array>
  abstract async decrypt(ciphermsg: Uint8Array): Promise<Uint8Array>

  protected setState(state: KeyState) {
    if (this.state !== state) {
      log.debug('key state = ' + KeyState[state])
      this.state = state
      this.onStateChange(this.state)
    }
  }
}
