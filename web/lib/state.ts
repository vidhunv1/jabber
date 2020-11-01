import { Layout, Schema } from './borsh'
import BN from 'bn.js'

export type UserProfileType = Omit<UserProfile, 'encode'>
export class UserProfile extends Layout {
  name: string | null
  bio: string | null
  lamportsPerMessage: BN

  static SEED = 'profile'
  static SPACE = 55 + 165 + 8
  static schema: Schema = new Map([
    [
      UserProfile,
      {
        kind: 'struct',
        fields: [
          ['name', { kind: 'option', type: 'string' }],
          ['bio', { kind: 'option', type: 'string' }],
          ['lamportsPerMessage', 'u64'],
        ],
      },
    ],
  ])

  constructor(u: UserProfileType) {
    if (u.bio.length > 160 || u.name.length > 50) {
      throw new Error('Invalid profile input')
    }
    super(UserProfile.schema, u)
  }
}
