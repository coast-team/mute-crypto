import { Observable, Subject, Subscription } from 'rxjs'

import { symmetricCrypto } from 'crypto-api-wrapper'
import { GroupStatus } from '../GroupStatus'
import { KeyStatus } from '../KeyStatus'
import { IMessage, Message } from '../proto/index'
import { Cycle, KeyId } from './Cycle'
import { Step } from './Step'

export class KeyAgreementBD {
  public static STREAM_ID = 700

  public status: KeyStatus
  public key: Key | undefined
  public previousKey: Key | undefined

  private subs: Subscription[]
  private statusSubject: Subject<KeyStatus>
  private groupStatus: GroupStatus
  private cycle: Cycle

  constructor(
    memberJoinSource: Observable<{ myId: number; id: number }>,
    memberLeaveSource: Observable<{ myId: number; id: number }>,
    groupStatusSource: Observable<{ myId: number; status: GroupStatus }>,
    messageSource: Observable<{ id: number; content: Uint8Array }>,
    send: (msg: Uint8Array, streamID: number) => void
  ) {
    this.key = undefined
    this.statusSubject = new Subject()
    this.cycle = new Cycle((msg: IMessage) =>
      send(Message.encode(Message.create(msg)).finish(), KeyAgreementBD.STREAM_ID)
    )
    this.status = KeyStatus.UNDEFINED
    this.subs = []
    this.groupStatus = GroupStatus.LEFT

    // Subscribe to network events
    this.setMemberJoinSource(memberJoinSource)
    this.setMemberLeaveSource(memberLeaveSource)
    this.setGroupStatusSource(groupStatusSource)
    this.setMessageSource(messageSource)

    // Subscribe to key
    this.subs.push(
      this.cycle.onStepChange.subscribe(({ step, key, keyId }) => {
        switch (step) {
          case Step.INITIALIZED:
            this.status = KeyStatus.UNDEFINED
            this.statusSubject.next(this.status)
            break
          case Step.READY:
            this.status = KeyStatus.READY
            if (this.key) {
              this.previousKey = this.key
            }
            this.key = new Key(key as CryptoKey, keyId as KeyId)
            symmetricCrypto.exportKey(this.key.value).then((jsonWebKey) => {
              console.log('MUTE-CRYPTO: KEY IS READY -> ', symmetricCrypto.toB64(jsonWebKey))
            })
            this.statusSubject.next(this.status)
            break
          default:
            this.status = KeyStatus.CALCUL_IN_PROGRESS
            this.statusSubject.next(this.status)
        }
      })
    )
  }

  get onStatusChange(): Observable<KeyStatus> {
    return this.statusSubject.asObservable()
  }

  dispose() {
    this.subs.forEach((sub) => sub.unsubscribe())
  }

  async encrypt(msg: Uint8Array): Promise<Uint8Array> {
    if (this.key && this.status === KeyStatus.READY) {
      return symmetricCrypto.encrypt(msg, this.key.value)
    }
    throw new Error('Cryptographic key is not ready yet.')
  }

  async decrypt(ciphertext: Uint8Array): Promise<Uint8Array> {
    if (this.key && this.status === KeyStatus.READY) {
      return symmetricCrypto.decrypt(ciphertext, this.key.value)
    }
    throw new Error('Cryptographic key is not ready yet.')
  }

  private clean() {
    this.key = undefined
    this.status = KeyStatus.UNDEFINED
    this.subs = []
  }
  private setMemberJoinSource(memberJoinSource: Observable<{ myId: number; id: number }>) {
    this.subs.push(
      memberJoinSource.subscribe(({ myId, id }) => {
        this.cycle.myId = myId
        this.cycle.addMember(id)
        if (this.groupStatus === GroupStatus.JOINED && this.cycle.isInitiator) {
          console.log('MUTE-CRYPTO: new member has JOINED -> start cycle', this.cycle.toString())
          this.cycle.start()
        }
      })
    )
  }

  private setMemberLeaveSource(memberLeaveSource: Observable<{ myId: number; id: number }>) {
    memberLeaveSource.subscribe(({ myId, id }) => {
      this.cycle.myId = myId
      this.cycle.deleteMember(id)
      if (this.cycle.isInitiator && this.cycle.step !== Step.READY) {
        console.log('MUTE-CRYPTO: new member has LEFT -> start cycle', this.cycle.toString())
        this.cycle.start()
      }
    })
  }

  private setGroupStatusSource(
    groupStatusSource: Observable<{ myId: number; status: GroupStatus }>
  ) {
    this.subs.push(
      groupStatusSource.subscribe(({ myId, status }) => {
        // CHECK: verify this conditions
        if (status === GroupStatus.JOINED) {
          console.log('state changed: ', myId)
          this.groupStatus = status
          this.cycle.myId = myId
          if (this.cycle.isInitiator && this.cycle.step === Step.INITIALIZED) {
            console.log(
              'MUTE-CRYPTO: I have JOINED the group -> start cycle',
              this.cycle.toString()
            )
            this.cycle.start()
          }
        } else if (status === GroupStatus.LEFT) {
          this.clean()
        }
      })
    )
  }

  private setMessageSource(messageSource: Observable<{ id: number; content: Uint8Array }>) {
    this.subs.push(
      messageSource.subscribe(({ id, content }) =>
        this.cycle.onMessage(id, Message.decode(content))
      )
    )
  }
}

export class Key {
  public id: KeyId
  public value: CryptoKey

  constructor(key: CryptoKey, keyId: KeyId) {
    this.value = key
    this.id = keyId
  }
}
