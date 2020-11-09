import React from 'react'
import Avatar from './avatar'
import { PublicKey } from '@solana/web3.js'

interface ThreadProps {
  name?: string
  message: {
    participantPk: PublicKey
    lastMessage: string
    time: Date
    isOwnMsg: boolean
  }
}

const formatTime = (date: Date) => {
  const dayName = ['SUN', 'MON', 'TUES', 'WED', 'THURS', 'FRI', 'SAT']
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
const Thread = ({ name, message }: ThreadProps) => (
  <a href={`/c/${message.participantPk.toString()}`}>
    <div className="hover:bg-gray-200 cursor-pointer px-2 w-full">
      <div className="flex items-center h-20 w-auto">
        <Avatar seed={message.participantPk.toString()} className="h-12 w-12 mr-4" />
        <div className="content">
          <div className="flex items-center justify-between">
            <div>{name}</div>
            <div className="text-gray-600 text-xs">{formatTime(message.time)}</div>
          </div>
          <div className="text-gray-600 truncate">{message.lastMessage}</div>

          <style jsx>{`
            .content {
              width: 430px;
            }
          `}</style>
        </div>
      </div>
      <div className="h-px bg-gray-300 ml-16" />
    </div>
  </a>
)

const ThreadList = ({ list }: { list: ThreadProps[] }) => (
  <div>
    {list.map((l) => (
      <Thread {...l} key={l.message.participantPk.toString()} />
    ))}
  </div>
)

export default ThreadList
