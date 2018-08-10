import { symmetricCrypto } from '@coast-team/mute-crypto-helper'

import { log } from '../debug'
import { KeyState } from '../KeyState'
import { MuteCrypto } from '../MuteCrypto'
import { Streams } from '../Streams'
import { Cycle } from './Cycle'
import { Key } from './Key'
import { CipherMessage, IMessage, Message } from './proto/index'
import { Step } from './Step'

export class KeyAgreementBD extends MuteCrypto {
  private isReady: boolean
  private cycle: Cycle

  constructor() {
    super()
    this.isReady = false
    this.cycle = new Cycle()

    // Subscribe to key
    this.cycle.onStepChange = (step) => {
      switch (step) {
        case Step.INITIALIZED:
          super.setState(KeyState.UNDEFINED)
          break
        case Step.READY:
          symmetricCrypto.exportKey((this.cycle.key as Key).value).then((jsonWebKey) => {
            log.debug('KEY =', symmetricCrypto.toB64(jsonWebKey))
          })
          super.setState(KeyState.READY)
          break
        default:
          super.setState(KeyState.CALCUL_IN_PROGRESS)
      }
    }
  }

  async encrypt(msg: Uint8Array): Promise<Uint8Array> {
    if (this.cycle.key) {
      const content = await symmetricCrypto.encrypt(msg, this.cycle.key.value)
      return CipherMessage.encode(
        CipherMessage.create({
          id: this.cycle.key.initiatorId,
          counter: this.cycle.key.initiatorCounter,
          content,
        })
      ).finish()
    }
    throw new Error('Failed to ecnrypt a message: cryptographic key is not ready yet')
  }

  async decrypt(ciphermsg: Uint8Array): Promise<Uint8Array> {
    if (this.cycle.key) {
      const { id, counter, content } = CipherMessage.decode(ciphermsg)
      if (this.cycle.key.isEqual(id, counter)) {
        return symmetricCrypto.decrypt(content, this.cycle.key.value)
      } else if (this.cycle.previousKey && this.cycle.previousKey.isEqual(id, counter)) {
        return symmetricCrypto.decrypt(content, this.cycle.previousKey.value)
      }
    }
    throw new Error('Failed to decrypt a message')
  }

  public set onSend(send: (msg: Uint8Array, streamID: number) => void) {
    this.cycle.onSend = (msg: IMessage) =>
      send(Message.encode(Message.create(msg)).finish(), Streams.KEY_AGREEMENT_BD)
  }

  public addMember(id: number) {
    this.cycle.addMember(id)
    if (this.isReady && this.cycle.isInitiator) {
      log.debug('new member has JOINED -> start cycle', this.cycle.toString())
      this.cycle.start()
    }
  }

  public removeMember(id: number) {
    this.cycle.deleteMember(id)
    if (this.isReady && this.cycle.isInitiator) {
      log.debug('new member has LEFT -> start cycle', this.cycle.toString())
      this.cycle.start()
    }
  }

  public onMessage(id: number, content: Uint8Array) {
    this.cycle.onMessage(id, Message.decode(content))
  }

  public setMyId(myId: number) {
    this.cycle.myId = myId
  }

  public setReady() {
    this.isReady = true
    if (this.cycle.isInitiator && this.cycle.step === Step.INITIALIZED) {
      log.debug('I have JOINED the group -> start cycle', this.cycle.toString())
      this.cycle.start()
    }
  }
}
