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
      assert(
        this.isInitiator,
        this._myId + ' : ' + (myCounter + 1) + ': ' + 'Start a cycle by a none initiator'
      )
      perf.mark('start-cycle')

      perf.mark('start generate Ri')
      const r = keyAgreementCrypto.generateRi()
      perf.mark('end generate Ri')
      perf.mark('start generate Zi')
      const z = keyAgreementCrypto.computeZi(r)
      perf.mark('end generate Zi')
      perf.mark('start Z array')
      const zArray = new Array(this.members.length)
      zArray[0] = z
      perf.mark('start X array')
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

      this.send({ initiator: { id: this._myId, counter, members: this.members }, z })
      this.setStep(Step.WAITING_OTHERS_Z, this._myId, counter)
      log.debug(
        this._myId +
          ' : ' +
          counter +
          ': I am initiator and I start a new cyrcle by broadcasting my Z value',
        this.toString()
      )
    }
  }

  public onMessage(senderId: number, msg: Message) {
    const {
      initiator: { id, counter, members },
    } = msg as { initiator: Initiator }
    let cycleData = this.data.get(id)
    if (!members.includes(this._myId)) {
      return
    }
    if (cycleData === undefined || cycleData.counter < counter) {
      perf.mark('start-cycle')
      perf.mark('start generate Ri')
      const r = keyAgreementCrypto.generateRi()
      perf.mark('end generate Ri')
      perf.mark('start generate Zi')
      const z = keyAgreementCrypto.computeZi(r)
      perf.mark('end generate Zi')
      perf.mark('start Z array')
      const zArray = new Array(members.length)
      zArray[members.indexOf(this._myId)] = z
      perf.mark('start X array')
      const xArray = new Array(members.length)
      cycleData = { id, counter, members, r, zArray, xArray }
      this.data.set(id, cycleData)

      this.checkMyZ(cycleData, z)

      log.debug(
        id + ' : ' + counter + ': onMessage -> creating a new cycle entry & broadcast my Z value',
        {
          cycle: this.dataToString(cycleData),
          allCycles: this.toString(),
        }
      )
    }

    if (cycleData.counter === counter) {
      switch (msg.type) {
        case 'z': {
          const index = cycleData.members.indexOf(senderId)
          assert(
            index !== -1,
            cycleData.id +
              ' : ' +
              cycleData.counter +
              ': ' +
              'Unable to find a corresponding Z value of ',
            senderId
          )
          assert(
            cycleData.zArray[index] === undefined,
            cycleData.id + ' : ' + cycleData.counter + ': ' + 'Setting Z value twice'
          )
          cycleData.zArray[index] = msg.z
          log.debug(
            cycleData.id +
              ' : ' +
              cycleData.counter +
              ': ' +
              `received Z value from ${senderId}, ${index}: `,
            this.dataToString(cycleData)
          )
          this.checkZArray(cycleData)
          break
        }
        case 'x': {
          const index = cycleData.members.indexOf(senderId)

          assert(
            index !== -1,
            cycleData.id +
              ' : ' +
              cycleData.counter +
              ': ' +
              'Unable to find a corresponding X value of ',
            senderId
          )
          assert(
            cycleData.xArray[index] === undefined,
            cycleData.id + ' : ' + cycleData.counter + ': ' + 'Setting X value twice'
          )
          cycleData.xArray[index] = msg.x
          log.debug(
            cycleData.id +
              ' : ' +
              cycleData.counter +
              ': ' +
              `received X value from ${senderId}, ${index}: `,
            this.dataToString(cycleData)
          )
          this.checkXArray(cycleData)
          break
        }
      }
    }
  }

  private checkMembers() {
    this.isInitiator = this._myId <= Math.min(...this.members)
    if (!this.isInitiator) {
      switch (this.step) {
        case Step.WAITING_TO_BROADCAST_Z:
          for (const d of this.data.values()) {
            this.checkMyZ(d, d.zArray[d.members.indexOf(this._myId)])
          }
          break
        case Step.WAITING_OTHERS_Z:
          for (const d of this.data.values()) {
            this.checkZArray(d)
          }
          break
        case Step.WAITING_OTHERS_X:
          for (const d of this.data.values()) {
            this.checkXArray(d)
          }
          break
      }
    }
  }

  private checkMyZ(cycleData: IData, z: Uint8Array) {
    if (cycleData.members.every((m) => this.members.includes(m))) {
      this.send({
        initiator: { id: cycleData.id, counter: cycleData.counter, members: cycleData.members },
        z,
      })
      this.setStep(Step.WAITING_OTHERS_Z, cycleData.id, cycleData.counter)
      this.checkZArray(cycleData)
    } else {
      this.setStep(Step.WAITING_TO_BROADCAST_Z, cycleData.id, cycleData.counter)
    }
  }

  private checkZArray(data: IData) {
    if (this.step === Step.WAITING_OTHERS_Z) {
      const { id, counter, members: initiatorMembers, zArray, xArray, r } = data
      if (this.members.length < initiatorMembers.length) {
        log.debug(
          id + ' : ' + counter + ': checkZArray abort -> length of members are different',
          this.dataToString(data)
        )
        return
      }
      for (const m of initiatorMembers) {
        if (!this.members.includes(m)) {
          log.debug(
            id + ' : ' + counter + ': checkZArray abort -> missing a member',
            this.dataToString(data)
          )
          return
        }
      }
      for (const z of zArray) {
        if (z === undefined) {
          log.debug(
            id + ' : ' + counter + ': checkZArray abort -> missing Z value',
            this.dataToString(data)
          )
          return
        }
      }
      perf.mark('end Z array')

      const myIndex = initiatorMembers.indexOf(this._myId)
      const zRight = (myIndex + 1) % initiatorMembers.length
      const zLeft = (initiatorMembers.length + myIndex - 1) % initiatorMembers.length
      perf.mark('start generate Xi')
      const x = keyAgreementCrypto.computeXi(r, zArray[zRight], zArray[zLeft])
      perf.mark('end generate Xi')
      assert(xArray[myIndex] === undefined, id + ' : ' + counter + ': Setting my X value twice')
      xArray[myIndex] = x

      this.send({ initiator: { id, counter, members: initiatorMembers }, x })
      this.setStep(Step.WAITING_OTHERS_X, id, counter)
      this.checkXArray(data)
      log.debug(id + ' : ' + counter + ': checkZArray -> broadcast my X value', {
        cycle: this.dataToString(data),
        allCycles: this.toString(),
      })
    }
  }

  private async checkXArray(data: IData) {
    if (this.step === Step.WAITING_OTHERS_X) {
      const { id, counter, members: initiatorMembers, zArray, xArray, r } = data
      if (this.members.length < initiatorMembers.length) {
        log.debug(
          id + ' : ' + counter + ': checkXArray abort -> length of members are different',
          this.dataToString(data)
        )
        return
      }
      for (const m of initiatorMembers) {
        if (!this.members.includes(m)) {
          log.debug(
            id + ' : ' + counter + ': checkXArray abort -> missing a member',
            this.dataToString(data)
          )
          return
        }
      }
      if (xArray.length) {
        for (const x of xArray) {
          if (x === undefined) {
            log.debug(
              id + ' : ' + counter + ': checkXArray abort -> missing X value',
              this.dataToString(data)
            )
            return
          }
        }
      } else {
        log.debug(
          id + ' : ' + counter + ': checkXArray abort -> empty X array',
          this.dataToString(data)
        )
        return
      }

      perf.mark('end X array')
      const myIndex = initiatorMembers.indexOf(this._myId)
      const zLeft = (initiatorMembers.length + myIndex - 1) % initiatorMembers.length
      perf.mark('start compute shared secret')
      const sharedKey = keyAgreementCrypto.computeSharedSecret(
        r,
        xArray[myIndex],
        zArray[zLeft],
        xArray
      )
      perf.mark('end compute shared secret')

      if (this.key) {
        this.previousKey = this.key
      }
      perf.mark('start compute secret key')
      this.key = new Key(await keyAgreementCrypto.deriveKey(sharedKey), id, counter)
      perf.mark('end compute secret key')
      // FIXME: should be very careful on deleting data entries (only for optimization: memory leaks)
      // this.data.delete(id)

      perf.mark('end-cycle')
      perf.measure('generate Ri ', 'start generate Ri', 'end generate Ri')
      perf.measure('generate Zi ', 'start generate Zi', 'end generate Zi')
      perf.measure('waiting Z array', 'start Z array', 'end Z array')
      perf.measure('generate Xi ', 'start generate Xi', 'end generate Xi')
      perf.measure('waiting X array', 'start X array', 'end X array')
      perf.measure(
        'compute SHARED SECRET',
        'start compute shared secret',
        'end compute shared secret'
      )
      perf.measure('compute SECRET KEY', 'start compute secret key', 'end compute secret key')
      perf.measure(id + ' : ' + counter + ': group key computation ', 'start-cycle', 'end-cycle')
      this.setStep(Step.READY, id, counter)
    }
  }

  // For debugging
  private dataToString(data: IData): object {
    return {
      initiatorId: data.id,
      initiatorCounter: data.counter,
      initiatorMembers: data.members.slice(),
      myId: this._myId,
      myIndex: this.members.indexOf(this._myId),
      myMembers: this.members.slice(),
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

  private setStep(step: Step, id: number, counter: number) {
    if (this.step !== step) {
      log.debug(id + ' : ' + counter + ': cycle step = ' + Step[step])
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
