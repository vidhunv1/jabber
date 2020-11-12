import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { PublicKey, Connection } from '@solana/web3.js'
import { AppThunk } from '..'
import appConfig from '../../config'
import { getThreads, readProfile, readJabber } from '../../lib/jabber'
import _remove from 'lodash/remove'
import _findIndex from 'lodash/findIndex'
import { fetchProfile } from '../profile/profileSlice'
import { fetchMessages } from '../message/messageSlice'
import { parseThread } from './threadHooks'

export const THREAD_SLICE = 'thread'
export interface ThreadState {
  isFirstSynced: boolean
  count: number
  threads: {
    threadPk: string
    msgCount: number
    prevThreadPk: string
    participantPk: string
    id: number
    lastMsgRead: number
  }[]
}

const initialState: ThreadState = {
  isFirstSynced: false,
  count: 0,
  threads: [],
}

const threadSlice = createSlice({
  name: THREAD_SLICE,
  initialState,
  reducers: {
    setThread(state, action: PayloadAction<Omit<ThreadState['threads'][0], 'id'>>) {
      const id = state.count
      const index = _findIndex(state.threads, { threadPk: action.payload.threadPk })
      console.log('INDEX: ', index)
      if (index >= 0) {
        state.threads[index] = {
          ...action.payload,
          lastMsgRead: state.threads[index].lastMsgRead,
          id,
        }
      } else {
        state.threads.push({
          ...action.payload,
          id,
        })
      }

      state.count = state.count + 1
    },
    setSynced(state) {
      state.isFirstSynced = true
    },
    setThreadRead(state, action: PayloadAction<{ threadPk: string; lastMsgIndex: number }>) {
      const index = _findIndex(state.threads, { threadPk: action.payload.threadPk })
      state.threads[index] = {
        ...state.threads[index],
        lastMsgRead: action.payload.lastMsgIndex,
      }
    },
  },
})

const firstSyncAll = (userPk: PublicKey): AppThunk => async (dispatch, getState) => {
  const state = getState()
  if (!state.thread.isFirstSynced) {
    const connection = new Connection(appConfig.rpcUrl, 'recent')

    await dispatch(fetchProfile(userPk))

    let prePointer: PublicKey | null = null
    let currPointer: PublicKey | null = null
    const sProfile = await readProfile(connection, userPk, new PublicKey(appConfig.programId))
    if (!(sProfile == null || (sProfile && sProfile.threadTailPk == null))) {
      currPointer = sProfile.threadTailPk
    }
    // NOTE: This will get expensive as the number of chat thread's in the world grows.
    const jabber = await readJabber(connection, new PublicKey(appConfig.programId))
    if (jabber != null) {
      prePointer = jabber.unregisteredThreadTailPk
    }

    const preThreads = await getThreads(connection, userPk, prePointer, null, 'pre')
    const currentThreads = await getThreads(connection, userPk, currPointer, null, 'curr')
    const th = [...preThreads, ...currentThreads]

    for (let i = 0; i < th.length; i++) {
      const t = th[i]
      const tState = parseThread(t.thread, new PublicKey(t.pk), userPk)
      await dispatch(fetchProfile(new PublicKey(tState.participantPk)))
      await dispatch(setThread(tState))
      await dispatch(fetchMessages(new PublicKey(t.pk)))
    }
    dispatch(setSynced())
  }
}

export { firstSyncAll }
export const { setThread, setSynced, setThreadRead } = threadSlice.actions
export default threadSlice.reducer
