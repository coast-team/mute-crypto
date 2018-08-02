import { symmetricCrypto } from 'crypto-api-wrapper'
import { KeyState } from '../KeyState'
import { IMessage, Message } from '../proto/index'
import { Cycle } from './Cycle'
import { Key } from './Key'
import { Step } from './Step'

export class KeyAgreementBD {
  public static STREAM_ID = 700

  public state: KeyState
  public onStateChange: (state: KeyState) => void

  private isReady: boolean
  private cycle: Cycle

  constructor(send: (msg: Uint8Array, streamID: number) => void) {
    this.isReady = false
    this.onStateChange = () => {}
    this.cycle = new Cycle((msg: IMessage) =>
      send(Message.encode(Message.create(msg)).finish(), KeyAgreementBD.STREAM_ID)
    )
    this.state = KeyState.UNDEFINED

    // Subscribe to key
    this.cycle.onStepChange = (step) => {
      switch (step) {
        case Step.INITIALIZED:
          this.setState(KeyState.UNDEFINED)
          break
        case Step.READY:
          symmetricCrypto.exportKey((this.cycle.key as Key).value).then((jsonWebKey) => {
            console.log('MUTE-CRYPTO: KEY IS READY -> ', symmetricCrypto.toB64(jsonWebKey))
          })
          this.setState(KeyState.READY)
          break
        default:
          this.setState(KeyState.CALCUL_IN_PROGRESS)
      }
    }
  }

  async encrypt(msg: Uint8Array): Promise<Uint8Array> {
    if (this.cycle.key) {
      return symmetricCrypto.encrypt(msg, this.cycle.key.value)
    }
    throw new Error('Failed to ecnrypt a message: cryptographic key is not ready yet')
  }

  async decrypt(
    ciphertext: Uint8Array,
    initiatorId?: number,
    initiatorCounter?: number
  ): Promise<Uint8Array> {
    if (this.cycle.key) {
      if (initiatorId && initiatorCounter) {
        if (this.cycle.key.isEqual(initiatorId, initiatorCounter)) {
          return symmetricCrypto.decrypt(ciphertext, this.cycle.key.value)
        } else if (
          this.cycle.previousKey &&
          this.cycle.previousKey.isEqual(initiatorId, initiatorCounter)
        ) {
          return symmetricCrypto.decrypt(ciphertext, this.cycle.previousKey.value)
        }
      } else {
        return symmetricCrypto.decrypt(ciphertext, this.cycle.key.value)
      }
    }
    throw new Error('Failed to decrypt a message')
  }

  public addMember(id: number) {
    this.cycle.addMember(id)
    if (this.isReady && this.cycle.isInitiator) {
      console.log('MUTE-CRYPTO: new member has JOINED -> start cycle', this.cycle.toString())
      this.cycle.start()
    }
  }

  public removeMember(id: number) {
    this.cycle.deleteMember(id)
    if (this.cycle.isInitiator && this.cycle.step !== Step.READY) {
      console.log('MUTE-CRYPTO: new member has LEFT -> start cycle', this.cycle.toString())
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
      console.log('MUTE-CRYPTO: I have JOINED the group -> start cycle', this.cycle.toString())
      this.cycle.start()
    }
  }

  private setState(state: KeyState) {
    if (this.state !== state) {
      this.state = state
      this.onStateChange(this.state)
    }
  }
}
