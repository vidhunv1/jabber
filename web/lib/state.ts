import { Layout, Schema } from './borsh'
import BN from 'bn.js'
import { PublicKey, Account } from '@solana/web3.js'
import { encryptMessage, decryptMessage } from './enc'

export enum JabberErrorType {
  ProfileNotFound,
  InvalidMessage,
}
const eText: Record<JabberErrorType, string> = {
  [JabberErrorType.ProfileNotFound]: 'Profile does not exist',
  [JabberErrorType.InvalidMessage]: 'Invalid message',
}

export class JabberError extends Error {
  code: JabberErrorType
  constructor(e: JabberErrorType) {
    super(eText[e])
    this.code = e
  }
}

const MAX_SEED_LEN = 32
export type ProfileType = Omit<Profile, 'encode'>
export class Profile extends Layout {
  name: string | null
  bio: string | null
  lamportsPerMessage: BN
  threadTailPk: PublicKey | null

  static SEED = 'profile'
  static SPACE = 55 + 165 + 8
  static schema: Schema = new Map([
    [
      Profile,
      {
        kind: 'struct',
        fields: [
          ['name', { kind: 'option', type: 'string' }],
          ['bio', { kind: 'option', type: 'string' }],
          ['lamportsPerMessage', 'u64'],
          ['threadTailPk', { kind: 'option', type: 'pk' }],
        ],
      },
    ],
  ])

  constructor(u: ProfileType) {
    if (u.bio.length > 160 || u.name.length > 50) {
      throw new Error('Invalid profile input')
    }
    super(Profile.schema, u)
  }

  static createWithSeed(userPk: PublicKey, programId: PublicKey): Promise<PublicKey> {
    return PublicKey.createWithSeed(userPk, Profile.SEED, programId)
  }
}

export type ThreadType = Omit<Thread, 'encode'>
export class Thread extends Layout {
  msgCount: number
  prevThreadU1: PublicKey
  prevThreadU2: PublicKey
  u1: PublicKey
  u2: PublicKey

  static SPACE = 133
  static schema: Schema = new Map([
    [
      Thread,
      {
        kind: 'struct',
        fields: [
          ['msgCount', 'u32'],
          ['prevThreadU1', { kind: 'option', type: 'pk' }],
          ['prevThreadU2', { kind: 'option', type: 'pk' }],
          ['u1', 'pk'],
          ['u2', 'pk'],
        ],
      },
    ],
  ])

  constructor(u: ThreadType) {
    super(Thread.schema, u)
  }

  static getSeed(friend: PublicKey) {
    return friend.toString().substring(0, MAX_SEED_LEN)
  }

  static createWithSeed(creator: PublicKey, friend: PublicKey, programId: PublicKey) {
    return PublicKey.createWithSeed(creator, Thread.getSeed(friend), programId)
  }
}

export enum MessageKind {
  PlainUtf8 = 10,
  EncryptedUtf8 = 11,
}
export type MessageType = Omit<Message, 'encode'>
export class Message extends Layout {
  kind: MessageKind
  msg: Uint8Array
  timestamp: BN

  static schema: Schema = new Map([
    [
      Message,
      {
        kind: 'struct',
        fields: [
          ['kind', 'u8'],
          ['msg', ['u8']],
          ['timestamp', 'i64'],
        ],
      },
    ],
  ])

  constructor(u: MessageType) {
    super(Message.schema, u)
  }

  static getSeed(index: number, to: PublicKey) {
    const end = MAX_SEED_LEN - index.toString().length
    return `${index}${to.toString().substring(0, end)}`
  }

  static createWithSeed(index: number, from: PublicKey, to: PublicKey, programId: PublicKey): Promise<PublicKey> {
    return PublicKey.createWithSeed(from, Message.getSeed(index, to), programId)
  }

  static parseMessage(
    kind: MessageKind,
    msg: Uint8Array,
    messagePk: PublicKey,
    account: Account,
    otherPk: PublicKey,
  ): string {
    if (kind === MessageKind.PlainUtf8) {
      // plaintext
      return Buffer.from(msg).toString('utf-8')
    } else if (kind === MessageKind.EncryptedUtf8) {
      // encrypted message
      const nonce = new Uint8Array(messagePk.toBuffer()).slice(0, 24)
      return Buffer.from(decryptMessage(msg, account, otherPk, nonce)).toString('utf-8')
    }
    throw new JabberError(JabberErrorType.InvalidMessage)
  }

  static encodeMessage(
    kind: MessageKind,
    msg: Uint8Array,
    messagePk: PublicKey,
    sAccount: Account,
    rPublicKey: PublicKey,
  ): Uint8Array {
    if (kind === MessageKind.PlainUtf8) {
      return msg
    } else if (kind === MessageKind.EncryptedUtf8) {
      const nonce = new Uint8Array(messagePk.toBuffer()).slice(0, 24)
      return encryptMessage(msg, sAccount, rPublicKey, nonce)
    }
    throw new JabberError(JabberErrorType.InvalidMessage)
  }
}

export type JabberType = Omit<Jabber, 'encode'>
export class Jabber extends Layout {
  unregisteredThreadTailPk: PublicKey | null
  static SPACE = 33
  static SEED = 'jabber'
  static OWNER = new PublicKey('D2T7LaEp7SgQCZWvxbMfWym6LW2cSfX69oXpFLCDqbVS')

  static schema: Schema = new Map([
    [
      Jabber,
      {
        kind: 'struct',
        fields: [['unregisteredThreadTailPk', { kind: 'option', type: 'pk' }]],
      },
    ],
  ])

  constructor(u: JabberType) {
    super(Jabber.schema, u)
  }

  static createWithSeed(programId: PublicKey) {
    return PublicKey.createWithSeed(Jabber.OWNER, Jabber.SEED, programId)
  }
}
