import { Connection, PublicKey } from '@solana/web3.js'
import appConfig from '../../config'
import { Thread } from '../../lib/state'
import { useDispatch, useSelector } from 'react-redux'
import { setThread, ThreadState } from '../thread/threadSlice'
import { RootState } from '..'
import { fetchMessages } from './messageSlice'
import { parseThread } from '../thread/threadHooks'
import { useEffect } from 'react'
import _find from 'lodash/find'

export const useMessageSubsciption = (threadPk: PublicKey) => {
  const dispatch = useDispatch()
  const userPkStr = useSelector<RootState, string>((s) => s.wallet.publicKey)
  const currThread = useSelector<RootState, ThreadState['threads'][0]>((s) =>
    _find(s.thread.threads, { threadPk: threadPk.toString() }),
  )

  useEffect(() => {
    const userPk = new PublicKey(userPkStr)
    const connection = new Connection(appConfig.rpcUrl, 'recent')

    const sync = () => {
      connection.getAccountInfo(threadPk).then((threadData) => {
        if (threadData != null) {
          const thread = Thread.decode<Thread>(Thread.schema, Thread, threadData.data)
          if (thread.msgCount != currThread.msgCount) {
            dispatch(setThread(parseThread(thread, threadPk, userPk)))
            dispatch(fetchMessages(threadPk))
          }
        }
      })
    }
    sync()

    const id = connection.onAccountChange(
      threadPk,
      (td) => {
        const thread = Thread.decode<Thread>(Thread.schema, Thread, td.data)
        if (currThread.msgCount != thread.msgCount) {
          dispatch(setThread(parseThread(thread, threadPk, userPk)))
          dispatch(fetchMessages(threadPk))
        }
      },
      'recent',
    )
    return () => connection.removeAccountChangeListener(id)
  }, [dispatch, threadPk, userPkStr, currThread])
}
