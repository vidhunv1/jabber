import React from 'react'
import { Avatar } from './'
import { PublicKey } from '@solana/web3.js'
import Link from 'next/link'
import { isPublicKey } from '../../lib/solana'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProfile, ProfileState } from '../../store/profile/profileSlice'
import _get from 'lodash/get'
import { RootState } from '../../store'
import _find from 'lodash/find'
import { ThreadState } from '../../store/thread/threadSlice'
import { MessageState } from '../../store/message/messageSlice'
import { useMessageSubsciption } from '../../store/message/messageHook'

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
const ThreadItem = ({ userPk }: { userPk: PublicKey }) => {
  const dispatch = useDispatch()
  const thread = useSelector<RootState, ThreadState['threads'][0]>((s) =>
    _find(s.thread.threads, { participantPk: userPk.toString() }),
  )

  useMessageSubsciption(thread == null ? null : new PublicKey(thread.threadPk))
  const lastMessage = useSelector<RootState, MessageState>((s) =>
    s.message.reduce(
      (last, m) => (m.threadPk == _get(thread, 'threadPk', null) && m.msgIndex > (last ? last.msgIndex : 0) ? m : last),
      null,
    ),
  )
  const profile = useSelector<RootState, ProfileState | null>((s) => _find(s.profile, { userPk: userPk.toString() }))

  if (profile == null) {
    dispatch(fetchProfile(userPk))
  }
  const name = _get(profile, 'name', null)
  const lastMsg: { msg: MessageState | null; timestamp: Date | null } | null = {
    msg: lastMessage,
    timestamp: lastMessage != null ? new Date(lastMessage.timestamp * 1000) : null,
  }

  return (
    <Link href={`/c/${userPk}`}>
      <div className="hover:bg-gray-100 cursor-pointer px-2 w-full">
        <div className="flex items-center h-20 w-auto">
          <Avatar seed={userPk.toString()} className="h-12 w-12 mr-4" />
          <div className="content" style={{ width: '430px' }}>
            <div className="flex items-center justify-between">
              <div>{name || formatPk(new PublicKey(userPk.toString()))}</div>
              {lastMsg.msg && <div className="text-gray-600 text-xs">{formatTime(lastMsg.timestamp)}</div>}
            </div>
            {lastMsg.msg && <div className="text-gray-600 truncate">{lastMsg.msg.msg}</div>}
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
  const { recipientKeys, threadProfiles } = useSelector<RootState, any>((s) => {
    const threads = s.thread.threads
    const recipientKeys = threads.map((t) => t.participantPk)
    return {
      threads: s.thread.threads,
      recipientKeys: recipientKeys,
      threadProfiles: s.profile.filter((p) => recipientKeys.map((u) => u.toString()).includes(p.userPk)),
    }
  })

  const queryProfile = useSelector<RootState, ProfileState | null>((s) => _find(s.profile, { userPk: queryProfile }))

  const filter = query.toLowerCase()
  const exists = recipientKeys.some((l) => l.toString() == query)
  const list =
    filter.length === 0
      ? recipientKeys
      : recipientKeys.filter((u) => {
          const userPk = u.toString()
          const p = _find(threadProfiles, { userPk }, null)
          return u.toString().toLowerCase().includes(filter) || (p && p.name.includes(filter))
        })

  return (
    <div>
      {query != myPk && !exists && isPublicKey(query) && <ThreadItem userPk={new PublicKey(query)} />}
      {list.map((u, i) => (
        <ThreadItem key={i} userPk={new PublicKey(u)} />
      ))}
    </div>
  )
}

export default ThreadList
