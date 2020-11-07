import { Layout, Schema } from './borsh'
import BN from 'bn.js'
import { PublicKey } from '@solana/web3.js'

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

export type MessageType = Omit<Message, 'encode'>
export class Message extends Layout {
  kind: number
  msg: string
  timestamp: BN

  static schema: Schema = new Map([
    [
      Message,
      {
        kind: 'struct',
        fields: [
          ['kind', 'u8'],
          ['msg', 'string'],
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