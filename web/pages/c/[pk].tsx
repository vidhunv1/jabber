import React, { useState, useEffect } from 'react'
import { Avatar, MessageList } from '../../components/chat'
import { PublicKey } from '@solana/web3.js'
import Page from '../../components/page'
import Container from '../../components/container'
import { useRouter } from 'next/router'
import Error from 'next/error'
import { faChevronLeft, faPaperPlane } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import cn from 'classnames'
import Link from 'next/link'
import { isPublicKey } from '../../lib/solana'

const formatPk = (pk: PublicKey) => {
  const s = pk.toString()
  return `${s.substr(0, 4)}..${s.substr(s.length - 4, 4)}`
}

const Header = ({ userPk, name }: { userPk: PublicKey; name?: string }) => {
  return (
    <header className="flex justify-between text-black h-16 items-center border-b border-gray-300 px-2">
      <Link href="/">
        <a>
          <FontAwesomeIcon icon={faChevronLeft} className="text-gray-700 mr-6 h-12 w-12 cursor-pointer" size="2x" />
        </a>
      </Link>
      <a href={`https://explorer.solana.com/address/${userPk.toString()}`}>
        <div className="text-center">
          <div className="text-lg">{name || formatPk(userPk)}</div>
          {name && <div className="text-gray-500 text-sm hover:underline">{formatPk(userPk)}</div>}
        </div>
      </a>
      <Avatar className="w-10 h-10" seed={userPk.toString()} />
    </header>
  )
}

const Chat = () => {
  const [oMsg, setOMsg] = useState<string>('')
  const [msgs, setMsgs] = useState([])
  const router = useRouter()
  const { pk } = router.query
  const key = Array.isArray(pk) ? pk[0] : pk
  const isPk = isPublicKey(key)

  useEffect(() => {
    const m = []
    for (let i = 0; i <= 20; i++) {
      m.push(
        i % 2 == 0
          ? {
              id: 1,
              message:
                i +
                '==> sSample messageSample messageSampleSample messageSample messageSampleSample messageSample messageSampleSample messageSample messageSampleSample messageSample messageSample',
            }
          : {
              id: 0,
              message: i + '<==> Sample messageSample messageSample ',
            },
      )
    }
    setMsgs(m)
  }, [])

  const addMessage = () => {
    const m = [...msgs]
    m.push({
      id: 0,
      message: oMsg,
    })
    setOMsg('')
    setMsgs(m)
  }

  const handleKeyDown = (event: any) => {
    if (event.key === 'Enter') {
      addMessage()
    }
  }

  if (!isPk) {
    return <Error statusCode={404} title={`Public key ${key} is invalid`} />
  }

  return (
    <Page>
      <Container>
        <Header userPk={new PublicKey(key)} name="Vidhun" />
        <MessageList messages={msgs} />
        <div className="flex w-full py-2 px-2 bg-gray-400">
          <input
            autoFocus
            onKeyDown={handleKeyDown}
            className="bg-white appearance-none border-1 rounded w-full py-4 px-2 text-gray-700 leading-tight focus:outline-none focus:border-gray-400 shadow-md"
            type="text"
            placeholder="Message"
            onChange={(e) => setOMsg(e.target.value)}
            value={oMsg}
          ></input>
          <div className="w-16 h-12 pl-3">
            <button
              onClick={() => addMessage()}
              className={cn(
                'focus:outline-none rounded-full w-12 h-12',
                { 'bg-blue-500': oMsg.length > 0 },
                { 'bg-gray-500': oMsg.length == 0 },
              )}
            >
              <FontAwesomeIcon icon={faPaperPlane} className="text-white pr-1 pt-1" size="2x" />
            </button>
          </div>
        </div>
      </Container>
    </Page>
  )
}

export default Chat
