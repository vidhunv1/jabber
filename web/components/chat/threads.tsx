import React from 'react'
import { Avatar } from './'
import { PublicKey } from '@solana/web3.js'
import Link from 'next/link'
import { isPublicKey } from '../../lib/solana'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProfile, ProfileState } from '../../features/profile/profileSlice'
import _get from 'lodash/get'
import { RootState } from '../../features'
import _find from 'lodash/find'

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
const Thread = ({ userPk }: { userPk: PublicKey }) => {
  const dispatch = useDispatch()
  const profile = useSelector<RootState, ProfileState | null>((s) => _find(s.profile, { userPk: userPk.toString() }))

  if (profile == null) {
    dispatch(fetchProfile(userPk))
  }
  const name = _get(profile, 'name', null)
  const lastMsg: { msg: string; timestamp: Date } | null = {
    msg: 'Hey from ' + userPk.toString(),
    timestamp: new Date(),
  }

  return (
    <Link href={`/c/${userPk}`}>
      <div className="hover:bg-gray-100 cursor-pointer px-2 w-full">
        <div className="flex items-center h-20 w-auto">
          <Avatar seed={userPk.toString()} className="h-12 w-12 mr-4" />
          <div className="content" style={{ width: '430px' }}>
            <div className="flex items-center justify-between">
              <div>{name || formatPk(new PublicKey(userPk.toString()))}</div>
              {lastMsg && <div className="text-gray-600 text-xs">{formatTime(lastMsg.timestamp)}</div>}
            </div>
            {lastMsg && <div className="text-gray-600 truncate">{lastMsg.msg}</div>}
          </div>
        </div>
        <div className="h-px bg-gray-300 ml-16" />
      </div>
    </Link>
  )
}

// TODO: Memoize
const ThreadList = ({ userPkeys, query }: { userPkeys: PublicKey[]; query: string }) => {
  const threadProfiles = useSelector<RootState, ProfileState[]>((s) =>
    s.profile.filter((p) => userPkeys.map((u) => u.toString()).includes(p.userPk)),
  )
  const queryProfile = useSelector<RootState, ProfileState | null>((s) => _find(s.profile, { userPk: queryProfile }))

  const filter = query.toLowerCase()
  const exists = userPkeys.some((l) => l.toString() == query)
  const list =
    filter.length === 0
      ? userPkeys
      : userPkeys.filter((u) => {
          const userPk = u.toString()
          const p = _find(threadProfiles, { userPk }, null)
          return u.toString().toLowerCase().includes(filter) || (p && p.name.includes(filter))
        })
  return (
    <div>
      {!exists && isPublicKey(query) && <Thread userPk={new PublicKey(query)} />}
      {list.map((u, i) => (
        <Thread key={i} userPk={u} />
      ))}
    </div>
  )
}

export default ThreadList
