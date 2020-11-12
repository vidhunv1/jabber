import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import _ from 'lodash'
import { PublicKey, Connection, Account } from '@solana/web3.js'
import appConfig from '../../config'
import { AppThunk } from '..'
import { readProfile, setUserProfile } from '../../lib/jabber'
import { Profile } from '../../lib/state'
import BN from 'bn.js'
import config from '../../config'
import { airdrop, sendAndConfirmTransaction } from '../../lib/solana'

export const PROFILE_SLICE = 'profile'
export interface ProfileState {
  profilePk: string
  userPk: string
  name: string
  bio: string
  lamportsPerMessage: string // BigNumber
  threadTailPk: string | null
  lastUpdated: number
}

const initialState: ProfileState[] = []

const profileSlice = createSlice({
  name: PROFILE_SLICE,
  initialState,
  reducers: {
    setProfile(state, action: PayloadAction<ProfileState>) {
      _.remove(state, { profilePk: action.payload.profilePk })
      state.push(action.payload)
    },
  },
})

const fetchProfile = (userPk: PublicKey): AppThunk => async (dispatch) => {
  const profilePk = await Profile.createWithSeed(userPk, new PublicKey(appConfig.programId))
  const connection = new Connection(appConfig.rpcUrl, 'recent')
  const profile = await readProfile(connection, userPk, new PublicKey(appConfig.programId))
  if (profile != null) {
    dispatch(
      setProfile({
        profilePk: profilePk.toString(),
        userPk: userPk.toString(),
        name: profile.name,
        bio: profile.bio,
        threadTailPk: profile.threadTailPk == null ? null : profile.threadTailPk.toString(),
        lamportsPerMessage: profile.lamportsPerMessage ? profile.lamportsPerMessage.toString() : new BN('0').toString(),
        lastUpdated: +new Date(),
      }),
    )
  }
}

const saveProfile = (account: Account, name: string, bio: string, lamportsPerMessage: BN): AppThunk => async (
  dispatch,
) => {
  const profilePk = await Profile.createWithSeed(account.publicKey, new PublicKey(appConfig.programId))
  const connection = new Connection(appConfig.rpcUrl, 'recent')
  console.log('Using connection: ', appConfig.rpcUrl)

  // Request Airdrop if test
  // TODO: Will get airdrop everytime they change profile!
  if (config.environment === 'testnet' || config.environment === 'devnet') {
    console.log('Requesting airdrop')
    await airdrop(connection, account.publicKey.toString(), 10000000000)
  }

  const tx = await setUserProfile(connection, account, new PublicKey(appConfig.programId), {
    lamportsPerMessage: lamportsPerMessage,
    name,
    bio,
  })
  await sendAndConfirmTransaction('SetUserProfile', connection, tx, account)

  const newProfile = await readProfile(connection, profilePk, new PublicKey(appConfig.programId))
  dispatch(
    setProfile({
      profilePk: profilePk.toString(),
      userPk: account.publicKey.toString(),
      name: name,
      bio: bio,
      threadTailPk: newProfile == null || newProfile.threadTailPk == null ? null : newProfile.threadTailPk.toString(),
      lamportsPerMessage: lamportsPerMessage.toString(),
      lastUpdated: +new Date(),
    }),
  )
}
export { fetchProfile, saveProfile }
export const { setProfile } = profileSlice.actions
export default profileSlice.reducer
