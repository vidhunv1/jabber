import React, { useState, useRef, useEffect } from 'react'
import Avatar from '../../components/chat/avatar'
import { PublicKey } from '@solana/web3.js'
import Page from '../../components/page'
import Container from '../../components/container'
import { useRouter } from 'next/router'
import Error from 'next/error'
import { faChevronLeft, faPaperPlane } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import cn from 'classnames'
import { ChatFeed, Message } from 'react-chat-ui'

const isPublicKey = (pk: string): boolean => {
  try {
    new PublicKey(pk)
    console.log('TRUE')
    return true
  } catch (e) {
    console.log('FALSE')
    return false
  }
}

const formatPk = (pk: PublicKey) => {
  const s = pk.toString()
  return `${s.substr(0, 4)}..${s.substr(s.length - 4, 4)}`
}

const Header = ({ userPk, name }: { userPk: PublicKey; name?: string }) => {
  const router = useRouter()
  return (
    <header className="flex justify-between text-black h-16 items-center border-b border-gray-300 px-2">
      <button className="h-12 focus:outline-none" onClick={() => router.back()}>
        <FontAwesomeIcon icon={faChevronLeft} className="text-gray-700 mr-6" size="2x" />
      </button>
      <div className="text-center">
        <div className="text-lg">{name || formatPk(userPk)}</div>
        {name && <div className="text-gray-500 text-sm">{formatPk(userPk)}</div>}
      </div>
      <Avatar className="w-10 h-10" seed={userPk.toString()} />
    </header>
  )
}
const messages1 = [
  new Message({
    id: 1,
    message: 'Sample message',
  }),
  new Message({
    id: 0,
    message: 'Sample message',
  }),
  new Message({
    id: 0,
    message: 'Message',
  }),
]

const Chat = () => {
  const [oMsg, setOMsg] = useState<string>('')
  const msgEndEl = useRef(null)
  const router = useRouter()
  const { pk } = router.query
  const key = Array.isArray(pk) ? pk[0] : pk
  const isPk = isPublicKey(key)

  useEffect(() => {
    msgEndEl.current.scrollIntoView({ behavior: 'auto', block: 'end', inline: 'end' })
  }, [])

  if (!isPk) {
    return <Error statusCode={404} title={`Public key ${key} is invalid`} />
  }

  return (
    <Page>
      <Container>
        <Header userPk={new PublicKey(key)} name="Vidhun" />
        <style jsx>{`
          .chat {
            height: 78vh;
          }
        `}</style>

        <div className="chat bg-gray-300 px-3 relative overflow-y-scroll">
          <ChatFeed
            messages={messages1}
            bubbleStyles={{
              text: {
                fontSize: 15,
              },
              chatbubble: {
                backgroundColor: '#A0AEC0',
                borderRadius: 6,
                padding: 8,
              },
              userBubble: {
                backgroundColor: '#2F855A',
              },
            }}
          />
          {/* <div className="h-32 bg-green-900"></div> */}
          <div ref={msgEndEl} className="h-16"></div>
        </div>

        <div className="flex w-full py-2 px-2 bg-gray-300">
          <input
            className="bg-white appearance-none border-1 rounded w-full py-4 px-2 text-gray-700 leading-tight focus:outline-none focus:border-gray-400 shadow-md"
            type="text"
            placeholder="Message"
            onChange={(e) => setOMsg(e.target.value)}
            value={oMsg}
          ></input>
          <div className="w-16 h-12 pl-3">
            <button
              className={cn(
                'focus:outline-none rounded-full w-12 h-12',
                { 'bg-blue-500': oMsg.length > 0 },
                { 'bg-gray-500': oMsg.length == 0 },
              )}
            >
              <FontAwesomeIcon icon={faPaperPlane} className="text-white px-1 pt-1" size="2x" />
            </button>
          </div>
        </div>
      </Container>
    </Page>
  )
}

export default Chat
