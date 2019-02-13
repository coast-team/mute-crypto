import { asymmetricCrypto, symmetricCrypto } from '@coast-team/mute-crypto-helper'

import { bytesToString, log } from '../debug'
import { KeyState } from '../KeyState'
import { MuteCrypto } from '../MuteCrypto'
import { Streams } from '../Streams'
import { Cycle } from './Cycle'
import { Key } from './Key'
import { CipherMessage, Content, IContent, Initiator, Message } from './proto/index'
export class KeyAgreementBD extends MuteCrypto {
  public key: Key | undefined
  public previousKey: Key | undefined

  private isReady: boolean
  private myId: number
  private myCounter: number
  private readonly members: number[]
  private readonly cycles: Map<number, Cycle>
  private send: (msg: IContent) => void
  private _signingKey: CryptoKey | undefined

  constructor() {
    super()
    this._signingKey = undefined
    this.myCounter = 0
    this.cycles = new Map()
    this.members = []
    this.send = () => {}
    this.myId = 0
    this.key = undefined
    this.previousKey = undefined
    this.isReady = false
  }

  async encrypt(msg: Uint8Array): Promise<Uint8Array> {
    if (this.key) {
      const content = await symmetricCrypto.encrypt(msg, this.key.value)
      return CipherMessage.encode(
        CipherMessage.create({
          id: this.key.initiatorId,
          counter: this.key.initiatorCounter,
          content,
        })
      ).finish()
    }
    log.debug('Failed to encrypt a message: cryptographic key is not ready yet')
    throw new Error('Failed to encrypt a message: cryptographic key is not ready yet')
  }

  async decrypt(ciphermsg: Uint8Array): Promise<Uint8Array> {
    if (this.key) {
      const { id, counter, content } = CipherMessage.decode(ciphermsg)
      if (this.key.isEqual(id, counter)) {
        return symmetricCrypto.decrypt(content, this.key.value)
      } else if (this.previousKey && this.previousKey.isEqual(id, counter)) {
        return symmetricCrypto.decrypt(content, this.previousKey.value)
      }
    }

    log.debug('Failed to decrypt a message')
    throw new Error('Failed to decrypt a message')
  }

  public set signingKey(key: CryptoKey) {
    this._signingKey = key
  }

  public set onSend(send: (msg: Uint8Array, streamID: number) => void) {
    this.send = (msg) => {
      const content = Content.encode(Content.create(msg)).finish()
      if (this._signingKey) {
        asymmetricCrypto
          .sign(content, this._signingKey)
          .then((signature) => {
            log.debug('Signing message: ', { signature: bytesToString(signature) })
            send(
              Message.encode(Message.create({ content, signature })).finish(),
              Streams.KEY_AGREEMENT_BD
            )
          })
          .catch((err) => log.error('Signing failed: ', err))
      } else {
        send(Message.encode(Message.create({ content })).finish(), Streams.KEY_AGREEMENT_BD)
      }
    }
  }

  public addMember(id: number) {
    this.members.push(id)
    this.members.sort((a, b) => a - b)
    log.debug('MEMBER Joined: ', { id, currentMembers: this.members.slice() })
    this.checkCycles()
  }

  public removeMember(id: number) {
    const memberIndex = this.members.indexOf(id)
    if (memberIndex !== -1) {
      this.members.splice(memberIndex, 1)
    }
    log.debug('MEMBER Left: ', { id, currentMembers: this.members.slice() })
    this.checkCycles()
  }

  public async onMessage(senderId: number, msg: Uint8Array, key?: CryptoKey) {
    const { content, signature } = Message.decode(msg)
    const msgDecoded = Content.decode(content)
    const {
      initiator: { id, counter, members },
      type,
    } = msgDecoded as { initiator: Initiator; type: string }
    if (key) {
      if (!(await asymmetricCrypto.verifySignature(content, signature, key))) {
        log.error('Verify signature NOT OK: ', {
          id: senderId,
          signature: bytesToString(signature),
        })
        throw new Error('Wrong signature')
      }
      log.debug('Verify signature OK: ', { id: senderId, signature: bytesToString(signature) })
    }

    if (!members.includes(this.myId)) {
      return
    }
    let cycle = this.cycles.get(id)
    if (cycle === undefined || cycle.counter < counter) {
      super.setState(KeyState.CALCUL_IN_PROGRESS)
      cycle = this.createCycle(id, counter, members)
      cycle.debug('NOT an initiator starts a NEW CYCLE')
      if (!cycle.isZBroadcasted && cycle.isReadyToBroadcastZ(this.members)) {
        cycle.broadcastZ()
        cycle.checkZArray(this.myId, this.members)
      }
    }
    if (cycle.counter === counter && !cycle.isFinished) {
      const index = cycle.members.indexOf(senderId)
      switch (type) {
        case 'z':
          cycle.debug(`received Z value from ${senderId}, ${index}`)
          cycle.assert(index !== -1, 'Unable to find a corresponding Z value of ' + senderId)
          cycle.assert(cycle.zArray[index] === undefined, 'Setting Z value twice')
          cycle.zArray[index] = msgDecoded.z.slice()
          cycle.checkZArray(this.myId, this.members)
          break
        case 'x':
          cycle.debug(`received X value from ${senderId}, ${index}`)
          cycle.assert(index !== -1, 'Unable to find a corresponding X value of ' + senderId)
          cycle.assert(cycle.xArray[index] === undefined, 'Setting X value twice')
          cycle.addX(index, msgDecoded.x.slice())
          cycle.checkXArray(this.myId, this.members)
          break
      }
    }
  }

  public setMyId(id: number) {
    const index = this.members.indexOf(this.myId)
    if (index !== -1) {
      this.members[index] = id
    } else {
      this.members.push(id)
    }
    this.myId = id
    this.myCounter = 0
    this.members.sort((a, b) => a - b)
  }

  // Is called when you have joined the group
  public setReady() {
    this.isReady = true
    if (this.isInitiator) {
      this.start()
    }
  }

  private checkCycles() {
    if (this.members.length > 1) {
      if (this.isInitiator) {
        this.start()
      } else {
        for (const c of this.cycles.values()) {
          c.debug('CHECK CYCLE')
          if (!c.isFinished) {
            if (!c.isZBroadcasted && c.isReadyToBroadcastZ(this.members)) {
              c.broadcastZ()
              c.checkZArray(this.myId, this.members)
              continue
            }
            c.checkZArray(this.myId, this.members)
            c.checkXArray(this.myId, this.members)
          }
        }
      }
    }
  }

  private get isInitiator(): boolean {
    return this.members.length > 1 && this.members[0] === this.myId
  }

  private start() {
    if (this.isReady && this.members.length > 1) {
      super.setState(KeyState.CALCUL_IN_PROGRESS)
      log.debug('INITIATOR starts a NEW CYCLE')
      const cycle = this.createCycle(this.myId, ++this.myCounter, this.members)
      cycle.broadcastZ()
    }
  }

  private createCycle(id: number, counter: number, members: number[]): Cycle {
    const cycle = new Cycle(id, counter, members, this.myId, this.send, this.members)
    this.cycles.set(id, cycle)
    cycle.onKey = (key) => {
      if (this.key) {
        this.previousKey = this.key
      }
      this.key = key

      super.setState(KeyState.READY)
      symmetricCrypto.exportKey(this.key.value).then((jsonWebKey) => {
        log.debug('KEY =', symmetricCrypto.toB64(jsonWebKey))
      })
    }
    return cycle
  }
}
