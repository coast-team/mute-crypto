import { BN, keyAgreementCrypto } from '@coast-team/mute-crypto-helper'

import { assert, log, perf } from '../debug'
import { Key } from './Key'
import { IMessage, Initiator, Message } from './proto/index'
import { Step } from './Step'

export let myCounter = 0

export class Cycle {
  public isInitiator: boolean
  public step: Step
  public onStepChange: (step: Step) => void
  public key: Key | undefined
  public previousKey: Key | undefined

  private _myId: number
  private send: (msg: IMessage) => void
  private data: Map<number, IData>
  private members: number[]

  constructor() {
    this.isInitiator = false
    this.data = new Map()
    this.members = []
    this.send = () => {}
    this.onStepChange = () => {}
    this._myId = 0
    this.step = Step.INITIALIZED
  }

  set onSend(send: (msg: IMessage) => void) {
    this.send = send
  }

  get myId(): number {
    return this._myId
  }

  set myId(id: number) {
    const index = this.members.indexOf(this._myId)
    if (index !== -1) {
      this.members[index] = id
    } else {
      this.members.push(id)
    }
    this._myId = id
    this.members.sort((a, b) => a - b)
  }

  // For debugging
  public toString() {
    const cycles = []
    for (const d of this.data.values()) {
      cycles.push(this.dataToString(d))
    }
    return {
      step: Step[this.step],
      isInitiator: this.isInitiator,
      myId: this.myId,
      members: this.members.slice(),
      cycles,
    }
  }

  public addMember(newMemberId: number) {
    this.members.push(newMemberId)
    this.members.sort((a, b) => a - b)
    this.checkMembers()
  }

  public deleteMember(memberId: number) {
    const memberIndex = this.members.indexOf(memberId)
    if (memberIndex !== -1) {
      this.members.splice(memberIndex, 1)
    }
    this.checkMembers()
  }

  public start() {
    if (this.members.length > 1) {
      assert(this.isInitiator, 'Start a cycle by a none initiator')
      perf.mark('start-cycle')

      const r = keyAgreementCrypto.generateRi()
      const zArray = new Array(this.members.length)
      zArray[0] = keyAgreementCrypto.computeZi(r)
      const xArray = new Array(this.members.length)
      const counter = ++myCounter
      this.data.set(this._myId, {
        id: this._myId,
        counter,
        members: this.members,
        r,
        zArray,
        xArray,
      })

      this.send({ initiator: { id: this._myId, counter, members: this.members }, z: zArray[0] })
      this.setStep(Step.WAITING_Z)
      log.debug('broadcast my Z value', this.toString())
    }
  }

  public onMessage(senderId: number, msg: Message) {
    const { initiator } = msg as { initiator: Initiator }
    let cycleData = this.data.get(initiator.id)
    if (cycleData === undefined || cycleData.counter < initiator.counter) {
      const { id, counter, members } = msg.initiator as Initiator
      perf.mark('start-cycle')
      const r = keyAgreementCrypto.generateRi()
      const z = keyAgreementCrypto.computeZi(r)
      const zArray = new Array(members.length)
      zArray[members.indexOf(this._myId)] = keyAgreementCrypto.computeZi(r)
      const xArray = new Array(members.length)
      cycleData = { id, counter, members, r, zArray, xArray }
      this.data.set(id, cycleData)

      this.send({ initiator: { id, counter, members }, z })
      this.setStep(Step.WAITING_Z)
      log.debug('onMessage -> creating a new cycle entry & broadcast my Z value', {
        cycle: this.dataToString(cycleData),
        allCycles: this.toString(),
      })
    }
    switch (msg.type) {
      case 'z': {
        const index = cycleData.members.indexOf(senderId)
        assert(index !== -1, 'Unable to find a corresponding Z value of ', senderId)
        assert(cycleData.zArray[index] === undefined, 'Setting Z value twice')
        cycleData.zArray[index] = msg.z
        log.debug('receive Z value', {
          senderId,
          senderIndex: index,
          cycle: this.dataToString(cycleData),
        })
        this.checkZArray(cycleData)
        break
      }
      case 'x': {
        const index = cycleData.members.indexOf(senderId)

        assert(index !== -1, 'Unable to find a corresponding X value of ', senderId)
        assert(cycleData.xArray[index] === undefined, 'Setting X value twice')
        cycleData.xArray[index] = msg.x
        log.debug('receive X value', {
          senderId,
          senderIndex: index,
          cycle: this.dataToString(cycleData),
        })
        this.checkXArray(cycleData)
        break
      }
    }
  }

  private checkMembers() {
    this.isInitiator = this._myId <= Math.min(...this.members)
    if (!this.isInitiator) {
      if (this.step === Step.WAITING_Z) {
        for (const d of this.data.values()) {
          this.checkZArray(d)
        }
      } else if (this.step === Step.WAITING_X) {
        for (const d of this.data.values()) {
          this.checkXArray(d)
        }
      }
    }
  }

  private checkZArray(data: IData) {
    const { id, counter, members: initiatorMembers, zArray, xArray, r } = data
    if (this.members.length < initiatorMembers.length) {
      log.debug('checkZArray abort -> length of members are different', this.dataToString(data))
      return
    }
    for (const m of initiatorMembers) {
      if (!this.members.includes(m)) {
        log.debug('checkZArray abort -> missing a member', this.dataToString(data))
        return
      }
    }
    for (const z of zArray) {
      if (z === undefined) {
        log.debug('checkZArray abort -> missing Z value', this.dataToString(data))
        return
      }
    }

    const myIndex = initiatorMembers.indexOf(this._myId)
    const zRight = (myIndex + 1) % initiatorMembers.length
    const zLeft = (initiatorMembers.length + myIndex - 1) % initiatorMembers.length
    const x = keyAgreementCrypto.computeXi(r, zArray[zRight], zArray[zLeft])
    assert(xArray[myIndex] === undefined, 'Setting my X value twice')
    xArray[myIndex] = x

    this.send({ initiator: { id, counter, members: initiatorMembers }, x })
    this.setStep(Step.WAITING_X)
    log.debug('checkZArray -> broadcast my X value', {
      cycle: this.dataToString(data),
      allCycles: this.toString(),
    })
  }

  private async checkXArray(data: IData) {
    const { id, counter, members: initiatorMembers, zArray, xArray, r } = data
    if (this.members.length < initiatorMembers.length) {
      log.debug('checkXArray abort -> length of members are different', this.dataToString(data))
      return
    }
    for (const m of initiatorMembers) {
      if (!this.members.includes(m)) {
        log.debug('checkXArray abort -> missing a member', this.dataToString(data))
        return
      }
    }
    for (const x of xArray) {
      if (x === undefined) {
        log.debug('checkXArray abort -> missing X value', this.dataToString(data))
        return
      }
    }

    const myIndex = initiatorMembers.indexOf(this._myId)
    const zLeft = (initiatorMembers.length + myIndex - 1) % initiatorMembers.length
    const sharedKey = keyAgreementCrypto.computeSharedSecret(
      r,
      xArray[myIndex],
      zArray[zLeft],
      xArray
    )

    if (this.key) {
      this.previousKey = this.key
    }
    this.key = new Key(await keyAgreementCrypto.deriveKey(sharedKey), id, counter)
    this.data.delete(id)

    perf.mark('end-cycle')
    perf.measure('group key computation ', 'start-cycle', 'end-cycle')
    this.setStep(Step.READY)
  }

  // For debugging
  private dataToString(data: IData): object {
    return {
      myId: this._myId,
      initiatorId: data.id,
      initiatorCounter: data.counter,
      initiatorMembers: data.members.slice(),
      members: this.members.slice(),
      zArray: data.zArray.map((z) => {
        let res = ''
        z.forEach((v) => (res += String.fromCharCode(v)))
        return window.btoa(res)
      }),
      xArray: data.xArray.map((x) => {
        let res = ''
        x.forEach((v) => (res += String.fromCharCode(v)))
        return window.btoa(res)
      }),
    }
  }

  private setStep(step: Step) {
    if (this.step !== step) {
      log.debug('cycle step = ' + Step[step])
      this.step = step
      this.onStepChange(step)
    }
  }
}

interface IData {
  id: number
  counter: number
  members: number[]
  r: BN
  zArray: Uint8Array[]
  xArray: Uint8Array[]
}
