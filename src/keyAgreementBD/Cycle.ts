import { BN, keyAgreementCrypto } from 'crypto-api-wrapper'

import { IMessage, Initiator, Message } from '../proto'
import { Key } from './Key'
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

  constructor(send: (msg: IMessage) => void) {
    this.isInitiator = false
    this.data = new Map()
    this.members = []
    this.onStepChange = () => {}
    this._myId = 0
    this.send = send
    this.step = Step.INITIALIZED
  }

  get myId(): number {
    return this._myId
  }

  set myId(id: number) {
    if (this._myId === 0) {
      this._myId = id
      this.addMember(id)
    }
  }

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
      console.assert(this.isInitiator, 'Start a cycle by a none initiator')
      console.assert(
        !this.data.has(this.myId) ||
          ((this.data.get(this.myId) as IData).counter !== myCounter) === undefined,
        'Start the same cycle twice'
      )

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
      console.log('MUTE-CRYPTO: BROADCAST my Z value', this.toString())
    }
  }

  public onMessage(senderId: number, msg: Message) {
    const { initiator } = msg as { initiator: Initiator }
    let cycleData = this.data.get(initiator.id)
    if (cycleData === undefined || cycleData.counter < initiator.counter) {
      const { id, counter, members } = msg.initiator as Initiator
      const r = keyAgreementCrypto.generateRi()
      const z = keyAgreementCrypto.computeZi(r)
      const zArray = new Array(members.length)
      zArray[members.indexOf(this._myId)] = keyAgreementCrypto.computeZi(r)
      const xArray = new Array(members.length)
      cycleData = { id, counter, members, r, zArray, xArray }
      this.data.set(id, cycleData)

      this.send({ initiator: { id, counter, members }, z })
      this.setStep(Step.WAITING_Z)
      console.log('MUTE-CRYPTO: onMessage -> creating a new cycle entry & BROADCAST my Z value', {
        cycle: this.dataToString(cycleData),
        allCycles: this.toString(),
      })
    }
    switch (msg.type) {
      case 'z': {
        const index = cycleData.members.indexOf(senderId)
        console.assert(index !== -1, 'Unable to find a corresponding Z value of ', senderId)
        console.assert(cycleData.zArray[index] === undefined, 'Setting Z value twice')
        cycleData.zArray[index] = msg.z
        console.log('MUTE-CRYPTO: receive Z value', {
          senderId,
          senderIndex: index,
          cycle: this.dataToString(cycleData),
        })
        this.checkZArray(cycleData)
        break
      }
      case 'x': {
        const index = cycleData.members.indexOf(senderId)

        console.assert(index !== -1, 'Unable to find a corresponding X value of ', senderId)
        console.assert(cycleData.xArray[index] === undefined, 'Setting X value twice')
        cycleData.xArray[index] = msg.x
        console.log('MUTE-CRYPTO: receive X value', {
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
      console.log(
        '______MUTE-CRYPTO: checkZArray abort -> length of members are different',
        this.dataToString(data)
      )
      return
    }
    for (const m of initiatorMembers) {
      if (!this.members.includes(m)) {
        console.log(
          '______MUTE-CRYPTO: checkZArray abort -> missing a member',
          this.dataToString(data)
        )
        return
      }
    }
    for (const z of zArray) {
      if (z === undefined) {
        console.log(
          '______MUTE-CRYPTO: checkZArray abort -> missing Z value',
          this.dataToString(data)
        )
        return
      }
    }

    const myIndex = initiatorMembers.indexOf(this._myId)
    const zRight = (myIndex + 1) % initiatorMembers.length
    const zLeft = (initiatorMembers.length + myIndex - 1) % initiatorMembers.length
    const x = keyAgreementCrypto.computeXi(r, zArray[zRight], zArray[zLeft])
    console.assert(xArray[myIndex] === undefined, 'Setting my X value twice')
    xArray[myIndex] = x

    this.send({ initiator: { id, counter, members: initiatorMembers }, x })
    this.setStep(Step.WAITING_X)
    console.log('MUTE-CRYPTO: checkZArray -> BROADCAST my X value', {
      cycle: this.dataToString(data),
      allCycles: this.toString(),
    })
  }

  private async checkXArray(data: IData) {
    const { id, counter, members: initiatorMembers, zArray, xArray, r } = data
    if (this.members.length < initiatorMembers.length) {
      console.log(
        '______MUTE-CRYPTO: checkXArray abort -> length of members are different',
        this.dataToString(data)
      )
      return
    }
    for (const m of initiatorMembers) {
      if (!this.members.includes(m)) {
        console.log(
          '______MUTE-CRYPTO: checkXArray abort -> missing a member',
          this.dataToString(data)
        )
        return
      }
    }
    for (const x of xArray) {
      if (x === undefined) {
        console.log(
          '______MUTE-CRYPTO: checkXArray abort -> missing X value',
          this.dataToString(data)
        )
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
    this.key = new Key(await keyAgreementCrypto.deriveKey(sharedKey), { id, counter })
    this.data.delete(id)
    this.setStep(Step.READY)
    console.log('MUTE-CRYPTO: SUCCESS -> a key has been created: ', this.dataToString(data))
  }

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
