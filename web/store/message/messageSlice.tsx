import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { MessageKind, Message } from '../../lib/state'
import { PublicKey, Connection, Account } from '@solana/web3.js'
import { AppThunk } from '..'
import { getMessages } from '../../lib/jabber'
import appConfig from '../../config'
import _find from 'lodash/find'
import _remove from 'lodash/remove'

export const MESSAGE_SLICE = 'message'
export interface MessageState {
  msgPk: string
  msgIndex: number
  threadPk: string
  kind: MessageKind
  msg: string
  timestamp: number
}

const initialState: MessageState[] = []

const messageSlice = createSlice({
  name: MESSAGE_SLICE,
  initialState,
  reducers: {
    addMessage(state, action: PayloadAction<MessageState>) {
      _remove(state, { msgPk: action.payload.msgPk })
      state.push(action.payload)
    },
  },
})

const fetchMessages = (threadPk: PublicKey): AppThunk => async (dispatch, getState) => {
  // get the last available message index
  const state = getState()
  const myPk = state.wallet.publicKey
  const userAccount = new Account(new Uint8Array(JSON.parse(`[${state.wallet.secretKey}]`)))
  const threadStr = threadPk.toString()
  const thread = _find(state.thread.threads, { threadPk: threadStr })
  if (!thread) {
    console.error('Invalid thread: ', threadStr)
  }
  let lastMsgIndex: number | null = null
  state.message.map((m) => {
    if (m.threadPk === threadStr) {
      if (lastMsgIndex == null || m.msgIndex > lastMsgIndex) {
        lastMsgIndex = m.msgIndex
      }
    }
  })

  const connection = new Connection(appConfig.rpcUrl, 'recent')
  const msgs = await getMessages(
    connection,
    new PublicKey(thread.participantPk),
    new PublicKey(myPk),
    new PublicKey(appConfig.programId),
    lastMsgIndex + 1,
    thread.msgCount - 1,
  )

  msgs.map((m) =>
    dispatch(
      addMessage({
        msgPk: m.pk.toString(),
        msgIndex: m.id,
        threadPk: threadStr,
        kind: m.msg.kind,
        msg: Message.parseMessage(
          m.msg.kind,
          new Uint8Array(m.msg.msg),
          m.pk,
          userAccount,
          new PublicKey(thread.participantPk),
        ),
        timestamp: m.msg.timestamp.toNumber(),
      }),
    ),
  )

  console.log(`Saved ${msgs.length} messages`)
}

export { fetchMessages }
export const { addMessage } = messageSlice.actions
export default messageSlice.reducer
