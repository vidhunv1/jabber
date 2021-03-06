import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { MessageKind, Message } from '../../lib/state'
import { PublicKey, Connection, Account } from '@solana/web3.js'
import { AppThunk } from '..'
import { getMessages, sendMessage as sendMessageJabber } from '../../lib/jabber'
import appConfig from '../../config'
import _find from 'lodash/find'
import _remove from 'lodash/remove'
import _findIndex from 'lodash/findIndex'
import { sendAndConfirmTransaction } from '../../lib/solana'

export const MESSAGE_SLICE = 'message'

export enum MsgMeta {
  SENDING,
  SENT,
  SEND_FAILED,
}
export interface MessageState {
  msgPk: string
  msgIndex: number
  threadPk: string
  senderPk: string
  kind: MessageKind
  msg: string
  timestamp: number
  meta: MsgMeta[]
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
    setMeta(state, action: PayloadAction<{ msgPk: string; meta: MsgMeta[] }>) {
      const index = _findIndex(state, { msgPk: action.payload.msgPk })
      if (index >= 0) {
        state[index].meta = action.payload.meta
      }
    },
  },
})

const sendMessage = (msg: string, participantPk: string): AppThunk => async (dispatch, getState) => {
  const state = getState()
  if (!state.wallet.publicKey) {
    throw new Error('No user available')
  }

  const userAccount = new Account(new Uint8Array(JSON.parse(`[${state.wallet.secretKey}]`)))
  const connection = new Connection(appConfig.rpcUrl, 'recent')
  const msgKind = MessageKind.EncryptedUtf8
  const { tx, msgPk, msgIndex, threadPk } = await sendMessageJabber(
    connection,
    userAccount,
    new PublicKey(participantPk),
    new PublicKey(appConfig.programId),
    msg,
    msgKind,
  )

  dispatch(
    addMessage({
      msgPk: msgPk.toString(),
      msgIndex: msgIndex,
      threadPk: threadPk.toString(),
      kind: msgKind,
      senderPk: userAccount.publicKey.toString(),
      msg,
      timestamp: +new Date(),
      meta: [],
    }),
  )
  try {
    dispatch(setMeta({ msgPk: msgPk.toString(), meta: [MsgMeta.SENDING] }))
    await sendAndConfirmTransaction('SendMessage', connection, tx, userAccount)
    dispatch(setMeta({ msgPk: msgPk.toString(), meta: [MsgMeta.SENT] }))
  } catch (e) {
    console.error('Error sending message: ', msg)
    dispatch(setMeta({ msgPk: msgPk.toString(), meta: [MsgMeta.SEND_FAILED] }))
  }
}

const fetchMessages = (threadPk: PublicKey, ignoreSent?: boolean): AppThunk => async (dispatch, getState) => {
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

  msgs.map((m) => {
    let parsedMessage = null
    try {
      parsedMessage = Message.parseMessage(
        m.msg.kind,
        new Uint8Array(m.msg.msg),
        m.pk,
        userAccount,
        new PublicKey(thread.participantPk),
      )
    } catch (e) {}

    if (!ignoreSent || (ignoreSent && myPk != m.senderPk.toString())) {
      dispatch(
        addMessage({
          msgPk: m.pk.toString(),
          msgIndex: m.id,
          threadPk: threadStr,
          kind: m.msg.kind,
          senderPk: m.senderPk.toString(),
          msg: parsedMessage,
          timestamp: m.msg.timestamp.toNumber() * 1000,
          meta: m.senderPk.toString() === myPk ? [MsgMeta.SENT] : [],
        }),
      )
    }
  })

  console.log(`Saved ${msgs.length} messages`)
}

export { fetchMessages, sendMessage }
export const { addMessage, setMeta } = messageSlice.actions
export default messageSlice.reducer
