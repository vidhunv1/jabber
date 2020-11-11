import { Connection, PublicKey, AccountInfo } from '@solana/web3.js'
import appConfig from '../../config'
import { ThreadState, setThread } from './threadSlice'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '..'
import _find from 'lodash/find'
import { getThreads } from '../../lib/jabber'
import { fetchProfile, ProfileState } from '../profile/profileSlice'
import { fetchMessages } from '../message/messageSlice'
import { Profile, Thread } from '../../lib/state'

export const useNewThreadSubsription = () => {
  console.log('Thread hooked')
  const dispatch = useDispatch()
  const userPkStr = useSelector<RootState, string>((s) => s.wallet.publicKey)
  const stateProfile = useSelector<RootState, ProfileState | null>((s) => _find(s.profile, { userPk: userPkStr }))
  const lastThreadPk = useSelector<RootState, PublicKey | null>((t) => {
    const max = t.thread.threads.reduce((acc, t) => (t.id > acc ? t.id : acc), -1)
    if (max === -1) {
      return null
    }
    return new PublicKey(_find(t.thread.threads, { id: max }).threadPk)
  })

  useEffect(() => {
    if (!userPkStr || !stateProfile) {
      return
    }
    const stateProfilePk = new PublicKey(stateProfile.profilePk)
    const userPk = new PublicKey(userPkStr)
    const connection = new Connection(appConfig.rpcUrl, 'recent')

    const process = async (profileData: AccountInfo<Buffer>) => {
      const profile = Profile.decode<Profile>(Profile.schema, Profile, profileData.data)
      if (profile.threadTailPk == null || stateProfile.threadTailPk === profile.threadTailPk.toString()) {
        return
      }
      const threads = await getThreads(connection, userPk, profile.threadTailPk, lastThreadPk, 'curr')
      for (let i = 0; i < threads.length; i++) {
        const t = threads[i]
        const tState = parseThread(t.thread, new PublicKey(t.pk), userPk)
        await dispatch(fetchProfile(new PublicKey(tState.participantPk)))
        await dispatch(setThread(tState))
        await dispatch(fetchMessages(new PublicKey(t.pk)))
      }
    }
    const sync = async () => {
      const profileData = await connection.getAccountInfo(stateProfilePk)
      if (profileData != null) {
        process(profileData)
      }
    }
    sync()

    const id = connection.onAccountChange(
      stateProfilePk,
      async (profileData) => {
        process(profileData)
      },
      'recent',
    )
    return () => connection.removeAccountChangeListener(id)
  }, [dispatch, lastThreadPk, stateProfile, userPkStr])
}

export const parseThread = (
  thread: Thread,
  threadPk: PublicKey,
  userPk: PublicKey,
): Omit<ThreadState['threads'][0], 'id'> => {
  const [recipientPk, prevThreadPk] = thread.u1.equals(userPk)
    ? [thread.u2, thread.prevThreadU2]
    : [thread.u1, thread.prevThreadU1]

  return {
    threadPk: threadPk.toString(),
    msgCount: thread.msgCount,
    prevThreadPk: prevThreadPk != null ? prevThreadPk.toString() : null,
    participantPk: recipientPk.toString(),
  }
}

// if (profile.threadTailPk != null) {
//   const threads = await getThreads(connection, userPk, profile.threadTailPk, threadPk)
//   for (let i = 0; i < th.length; i++) {
//     const t = th[i]
//     const tState = parseThread(t.thread, new PublicKey(t.pk), userPk)
//     await dispatch(fetchProfile(new PublicKey(tState.participantPk)))
//     await dispatch(setThread(tState))
//     await dispatch(fetchMessages(new PublicKey(t.pk)))
//   }
// }
