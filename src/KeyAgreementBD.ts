import { keyAgreementCrypto } from 'crypto-api-wrapper'
import { Observable, Subscription } from 'rxjs'

import { KeyStatusEnum } from './KeyStatusEnum'

export enum GroupStatus {
  JOINING,
  JOINED,
  LEFT,
}

export enum Step {
  WAITING_Z,
  WAITING_X,
  READY,
}

export class KeyAgreementBD {
  public status: KeyStatusEnum
  isInitiator: boolean

  private key: CryptoKey | undefined
  private subs: Subscription[]

  private groupStatus: GroupStatus
  private step: Step
  private initiatorMembers: number[]
  private members: number[]
  private myId: number
  private r: any | undefined // BN
  private zArray: any[] // BN[]
  private xArray: any[] // BN[]

  constructor(
    memberJoinSource: Observable<{ myId: number; id: number }>,
    memberLeaveSource: Observable<{ myId: number; id: number }>,
    groupStatusSource: Observable<{ myId: number; status: GroupStatus }>,
    messageSource: Observable<{}>
  ) {
    this.step = Step.WAITING_Z
    this.isInitiator = false
    this.key = undefined
    this.status = KeyStatusEnum.UNDEFINED
    this.subs = []
    this.members = []
    this.initiatorMembers = []
    this.myId = 0
    this.r = undefined
    this.zArray = []
    this.xArray = []
    this.groupStatus = GroupStatus.LEFT

    // Subscribe to network events
    this.setMemberJoinSource(memberJoinSource)
    this.setMemberLeaveSource(memberLeaveSource)
    this.setGroupStatusSource(groupStatusSource)
  }

  dispose() {
    this.subs.forEach((sub) => sub.unsubscribe())
  }

  private verifyInitiator() {
    this.isInitiator = this.myId <= Math.min(...this.members)
  }

  private init(myId: number) {
    if (this.myId === 0) {
      this.myId = myId
    }
  }

  private clean() {
    this.isInitiator = false
    this.key = undefined
    this.status = KeyStatusEnum.UNDEFINED
    this.subs = []
    this.members = []
    this.initiatorMembers = []
    this.myId = 0
    this.r = undefined
    this.zArray = []
    this.xArray = []
  }

  private addMember(id: number) {
    this.members.push(id)
    this.members.sort()
  }

  private deleteMember(id: number) {
    const memberIndex = this.members.indexOf(id)
    if (memberIndex >= 0) {
      this.members.splice(memberIndex, 1)
    }
    // else should never happen !
  }

  private setMemberJoinSource(memberJoinSource: Observable<{ myId: number; id: number }>) {
    this.subs.push(
      memberJoinSource.subscribe(({ myId, id }) => {
        this.init(myId)
        this.addMember(id)
        if (this.groupStatus === GroupStatus.JOINED) {
          this.verifyInitiator()
          if (this.isInitiator) {
            this.startCycle()
          } else if (this.step === Step.WAITING_Z) {
            // Update protocol
          } else if (this.step === Step.WAITING_X) {
            // Update protocol
          }
        }
      })
    )
  }

  private setMemberLeaveSource(memberLeaveSource: Observable<{ myId: number; id: number }>) {
    memberLeaveSource.subscribe(({ myId, id }) => {
      this.init(myId)
      this.deleteMember(id)
      this.verifyInitiator()
      if (this.isInitiator && this.step !== Step.READY) {
        this.startCycle()
      } else if (this.step === Step.WAITING_Z) {
        // Update protocol
      } else if (this.step === Step.WAITING_X) {
        // Update protocol
      }
    })
  }

  private setGroupStatusSource(
    groupStatusSource: Observable<{ myId: number; status: GroupStatus }>
  ) {
    this.subs.push(
      groupStatusSource.subscribe(({ myId, status }) => {
        if (status === GroupStatus.JOINED) {
          this.init(myId)
          this.verifyInitiator()
          if (this.isInitiator) {
            this.startCycle()
          }
        } else if (status === GroupStatus.LEFT) {
          this.clean()
        }
      })
    )
  }

  private startCycle() {}
}
