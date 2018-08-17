import { BN, keyAgreementCrypto } from '@coast-team/mute-crypto-helper'

import { assert, log, perf } from '../debug'
import { Key } from './Key'
import { IMessage } from './proto/index'

export class Cycle {
  public id: number // initiator's id
  public counter: number // initiator's counter
  public members: number[] // initiator's members
  public r: BN // my r
  public z: Uint8Array // my z
  public zArray: Uint8Array[] // my zArray of the same length as the initiator's members array
  public xArray: Uint8Array[] // my xArray of the same length as the initiator's members array
  public isZBroadcasted: boolean
  public isXBroadcasted: boolean
  public isFinished: boolean // Finished when the key has been generated

  private send: (msg: IMessage) => void
  private _onKey: (key: Key) => void // called when the key is ready (i.e. isFinished === true)
  private firstXadded: boolean // for debugging purposes only to know when the first x value was added to the xArray

  // For debugging
  private myId: number
  private myMembers: number[]

  constructor(
    id: number,
    counter: number,
    members: number[],
    myId: number,
    send: (msg: IMessage) => void,
    myMembers: number[]
  ) {
    perf.mark('start cycle')
    this.id = id
    this.myId = myId
    this.myMembers = myMembers
    this.isZBroadcasted = false
    this.isXBroadcasted = false
    this.isFinished = false
    this.firstXadded = false
    this.counter = counter
    this.members = members
    this.send = send
    this._onKey = () => {}
    this.r = keyAgreementCrypto.generateRi()
    perf.mark('R ready')
    this.z = keyAgreementCrypto.computeZi(this.r)
    perf.mark('Z ready')

    this.zArray = new Array(members.length)
    this.zArray[members.indexOf(myId)] = this.z // Push my z value to the zArray
    this.xArray = new Array(members.length)
  }

  addX(index: number, x: Uint8Array) {
    this.xArray[index] = x
    if (!this.firstXadded) {
      perf.mark('start X array')
    }
    this.firstXadded = true
  }

  set onKey(handler: (key: Key) => void) {
    this._onKey = handler
  }

  isReadyToBroadcastZ(members: number[]): boolean {
    // Ready to broadcast Z value only when all initiator's members are also in my members array
    return this.members.every((m) => members.includes(m))
  }

  checkZArray(myId: number, members: number[]) {
    if (this.isXBroadcasted) {
      this.debug('checkZArray abort -> X broadcasted already')
      return
    }
    if (!this.members.every((m) => members.includes(m))) {
      this.debug('checkZArray abort -> missing a member')
      return
    }
    for (const z of this.zArray) {
      if (z === undefined) {
        this.debug('checkZArray abort -> missing Z value')
        return
      }
    }
    perf.mark('Z array ready')
    this.debug('checkZArray OK')

    const myIndex = this.members.indexOf(myId)
    const zRight = (myIndex + 1) % this.members.length
    const zLeft = (this.members.length + myIndex - 1) % this.members.length
    const x = keyAgreementCrypto.computeXi(this.r, this.zArray[zRight], this.zArray[zLeft])
    perf.mark('X ready')
    this.assert(this.xArray[myIndex] === undefined, 'Setting my X value twice')
    this.addX(myIndex, x)
    this.broadcastX(x)
    this.checkXArray(myId, members)
  }

  async checkXArray(myId: number, members: number[]) {
    if (this.isFinished) {
      this.debug('checkXArray abort -> key computed already')
      return
    }
    if (!this.members.every((m) => members.includes(m))) {
      this.debug('checkXArray abort -> missing a member')
      return
    }
    for (const x of this.xArray) {
      if (x === undefined) {
        this.debug('checkXArray abort -> missing X value')
        return
      }
    }
    perf.mark('X array ready')
    this.isFinished = true
    this.debug('checkXArray OK')

    const myIndex = this.members.indexOf(myId)
    const zLeft = (this.members.length + myIndex - 1) % this.members.length
    const sk = keyAgreementCrypto.computeSharedSecret(
      this.r,
      this.xArray[myIndex],
      this.zArray[zLeft],
      this.xArray
    )
    const key = new Key(await keyAgreementCrypto.deriveKey(sk), this.id, this.counter)
    perf.mark('end cycle')
    perf.measure('R', 'start cycle', 'R ready')
    perf.measure('Z', 'R ready', 'Z ready')
    perf.measure('X', 'Z array ready', 'X ready')
    perf.measure('Z array full', 'Z ready', 'Z array ready')
    perf.measure('X array full', 'start X array', 'X array ready')
    perf.measure(`secret key`, 'X array ready', 'end cycle')
    perf.measure(`${this.id}(${this.counter}): cycle`, 'start cycle', 'end cycle')
    this._onKey(key)
  }

  debug(msg: string) {
    log.debug(`${this.id}(${this.counter}): ${msg}: `, this.formatCycle())
  }

  assert(condition: boolean, msg: string) {
    assert(condition, `${this.id}(${this.counter}): ${msg}`, this.formatCycle())
  }

  broadcastZ() {
    this.send({
      initiator: { id: this.id, counter: this.counter, members: this.members },
      z: this.z,
    })
    this.isZBroadcasted = true
    this.debug('broadcast my Z value')
  }

  broadcastX(x: Uint8Array) {
    this.send({
      initiator: { id: this.id, counter: this.counter, members: this.members },
      x,
    })
    this.isXBroadcasted = true
    this.debug('broadcast my X value')
  }

  private formatCycle(): object {
    return {
      initiatorId: this.id,
      initiatorCounter: this.counter,
      initiatorMembers: this.members.slice(),
      myId: this.myId,
      myMembers: this.myMembers.slice(),
      zArray: this.zArray.map((z) => {
        let res = ''
        z.forEach((v) => (res += String.fromCharCode(v)))
        return window.btoa(res).substring(0, 7)
      }),
      xArray: this.xArray.map((x) => {
        let res = ''
        x.forEach((v) => (res += String.fromCharCode(v)))
        return window.btoa(res).substring(0, 7)
      }),
    }
  }
}
