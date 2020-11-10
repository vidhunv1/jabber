import React, { useRef, useEffect } from 'react'
import cn from 'classnames'

// TODO: Virtualize
export const MessageList = ({ messages }: { messages: { id: number; message: string }[] }) => {
  const lastRef = useRef(null)
  const scrollToBottom = () => {
    lastRef.current.scrollIntoView()
    lastRef.current.scrollTop = lastRef.current.scrollHeight
  }
  useEffect(scrollToBottom, [messages])

  return (
    <div className="bg-gray-400 px-3 overflow-y-auto" style={{ height: '78vh' }}>
      {messages.map((msg, i) => (
        <ChatBubble key={i} isOwn={msg.id == 0} msg={msg.message} timestamp={new Date()} />
      ))}
      <div ref={lastRef} />
    </div>
  )
}

interface BubbleProps {
  isOwn: boolean
  msg: string
  timestamp: Date
}

export const ChatBubble = ({ msg, isOwn, timestamp }: BubbleProps) => {
  return (
    <div
      className={cn(
        'relative pb-2 max-w-sm py-2 px-4 rounded-md mt-1',
        { 'ml-auto': isOwn },
        isOwn ? 'bg-green-100' : 'bg-white',
      )}
    >
      <p className="text-md m-0">{msg}</p>
      <div className="absolute right-0 bottom-0 text-xs text-gray-500 mr-2">{`${timestamp.getHours()}:${timestamp.getMinutes()}`}</div>
    </div>
  )
}
