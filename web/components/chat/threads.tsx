import React from 'react'
import { Avatar } from './'
import { PublicKey } from '@solana/web3.js'
import Link from 'next/link'
import { isPublicKey } from '../../lib/solana'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProfile, ProfileState } from '../../store/profile/profileSlice'
import { RootState } from '../../store'
import _find from 'lodash/find'
import _get from 'lodash/get'
import _orderBy from 'lodash/orderBy'
import { ThreadState } from '../../store/thread/threadSlice'
import { MessageState } from '../../store/message/messageSlice'
import { useMessageSubsciption } from '../../store/message/messageHook'
import cn from 'classnames'

const formatPk = (pk: PublicKey) => {
  const s = pk.toString()
  return `${s.substr(0, 4)}..${s.substr(s.length - 4, 4)}`
}

const formatTime = (date: Date) => {
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const now = new Date()

  if (now.getDate() === date.getDate()) {
    return `${date.getHours()}:${date.getMinutes()}`
  } else if (now.getDate() - date.getDate() <= 6) {
    return dayName[now.getDay()]
  } else {
    const ds = date.toDateString()
    return ds.substr(ds.indexOf(' ') + 1)
  }
}
const ThreadItem = ({ userPk, lastMessage }: { userPk: PublicKey; lastMessage: MessageState | null }) => {
  const dispatch = useDispatch()
  const thread = useSelector<RootState, ThreadState['threads'][0]>((s) =>
    _find(s.thread.threads, { participantPk: userPk.toString() }),
  )
  useMessageSubsciption(thread == null ? null : new PublicKey(thread.threadPk))
  const profile = useSelector<RootState, ProfileState | null>((s) => _find(s.profile, { userPk: userPk.toString() }))

  if (profile == null) {
    dispatch(fetchProfile(userPk))
  }
  const name = _get(profile, 'name', null)
  const lastMsg: { msg: MessageState | null; timestamp: Date | null } | null = {
    msg: lastMessage,
    timestamp: lastMessage != null ? new Date(lastMessage.timestamp) : null,
  }

  const unreadCount = _get(lastMsg, 'msg.msgIndex', 0) - _get(thread, 'lastMsgRead', 0)
  return (
    <Link href={`/c/${userPk}`}>
      <div className="hover:bg-gray-100 cursor-pointer px-2 w-full">
        <div className="flex items-center h-20 w-auto">
          <Avatar seed={userPk.toString()} className="h-12 w-12 mr-4" />
          <div className="content" style={{ width: '430px' }}>
            <div className="flex items-center justify-between">
              <div>{name || formatPk(new PublicKey(userPk.toString()))}</div>
              {lastMsg && lastMsg.timestamp && (
                <div className="text-gray-600 text-xs">{formatTime(lastMsg.timestamp)}</div>
              )}
            </div>
            <div className="flex justify-between">
              {lastMsg.msg && (
                <div className={cn('truncate', unreadCount > 0 ? 'text-gray-900 font-bold' : 'text-gray-500')}>
                  {lastMsg.msg.msg}
                </div>
              )}
              {unreadCount > 0 && (
                <div className="rounded-full bg-green-500 w-5 h-5 text-xs text-white text-center pt-px">
                  {unreadCount}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="h-px bg-gray-300 ml-16" />
      </div>
    </Link>
  )
}

// TODO: Memoize
const ThreadList = ({ query }: { query: string }) => {
  const myPk = useSelector<RootState, string>((s) => s.wallet.publicKey)
  const { participants, threadProfiles, lastMessages } = useSelector<RootState, any>((s) => {
    const threads = s.thread.threads

    const lastMessages = s.message.reduce(
      (acc, m) => {
        const curr = acc[m.threadPk]
        if (curr == null || m.msgIndex > curr.msgIndex) {
          acc[m.threadPk] = m
        }
        return acc
      },
      threads.reduce((acc, m) => ({ ...acc, [m.threadPk]: null }), null),
    )

    const participants = _orderBy(
      threads.map((t) => [t.participantPk, t.threadPk]),
      (a) => (lastMessages[a[1]] == null ? 0 : lastMessages[a[1]].timestamp),
      ['desc'],
    )

    return {
      lastMessages,
      participants,
      threadProfiles: s.profile,
    }
  })

  const queryProfile = useSelector<RootState, ProfileState | null>((s) => _find(s.profile, { userPk: queryProfile }))

  const filter = query.toLowerCase()
  const exists = participants.some((l) => l[0] == query)
  const list =
    filter.length === 0
      ? participants
      : participants.filter((u) => {
          const userPk = u[0]
          const p = _find(threadProfiles, { userPk }, null)
          return userPk.toLowerCase().includes(filter) || (p && _get(p, 'name', '').toLowerCase().includes(filter))
        })

  return (
    <div>
      {query != myPk && !exists && isPublicKey(query) && (
        <ThreadItem userPk={new PublicKey(query)} lastMessage={null} />
      )}
      {list.map((u, i) => (
        <ThreadItem key={i} userPk={new PublicKey(u[0])} lastMessage={lastMessages[u[1]]} />
      ))}
    </div>
  )
}

export default ThreadList
