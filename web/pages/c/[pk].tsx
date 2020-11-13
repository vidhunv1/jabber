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
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store'
import { ProfileState } from '../../store/profile/profileSlice'
import _find from 'lodash/find'
import { ThreadState, setThreadRead } from '../../store/thread/threadSlice'
import { useMessageSubsciption } from '../../store/message/messageHook'
import { MessageState, sendMessage } from '../../store/message/messageSlice'
import _isArray from 'lodash/isArray'
import _get from 'lodash/get'
import { useNewThreadSubsription } from '../../store/thread/threadHooks'

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
  const dispatch = useDispatch()
  const router = useRouter()
  let participantPk: string
  if (router.query.pk == null) {
    participantPk = window.location.pathname.replace('/c/', '').replace(/[^a-z0-9]/gi, '')
  } else {
    participantPk = _isArray(router.query.pk) ? router.query.pk[0] : router.query.pk
  }
  const isValidParticipantPk = isPublicKey(participantPk)
  const userPk = useSelector<RootState, string | null>((s) => s.wallet.publicKey)
  const [myProfile, participantProfile] = useSelector<RootState, ProfileState[] | null>((s) => [
    _find(s.profile, { userPk: userPk }),
    _find(s.profile, { userPk: participantPk }),
  ])
  const [oMsg, setOMsg] = useState<string>('')
  const thread = useSelector<RootState, ThreadState['threads'][0]>((s) =>
    _find(s.thread.threads, { participantPk: participantPk }),
  )
  useMessageSubsciption(thread == null ? null : new PublicKey(thread.threadPk))
  useNewThreadSubsription()
  const messages = useSelector<RootState, MessageState[]>((s) =>
    s.message.filter((m) => m.threadPk === _get(thread, 'threadPk', null)).sort((m1, m2) => m1.msgIndex - m2.msgIndex),
  )
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (thread && thread.lastMsgRead < lastMessage.msgIndex) {
      dispatch(setThreadRead({ threadPk: thread.threadPk, lastMsgIndex: messages[messages.length - 1].msgIndex }))
    }
  }, [thread, messages, dispatch])

  if (userPk == null) {
    router.push('/init')
    return <></>
  }
  if (myProfile == null) {
    router.push('/profile')
    return <></>
  }

  if (!isValidParticipantPk) {
    return <Error statusCode={404} title={`Public key ${participantPk} is invalid`} />
  }

  const onSendMessage = async () => {
    if (oMsg.length > 0) {
      setOMsg('')
      await dispatch(sendMessage(oMsg, participantPk))
    }
  }

  const handleKeyDown = (event: any) => {
    if (event.key === 'Enter') {
      onSendMessage()
    }
  }

  return (
    <Page>
      <Container>
        <Header userPk={new PublicKey(participantPk)} name={_get(participantProfile, 'name', undefined)} />
        <MessageList
          myPk={userPk}
          messages={messages.map((m) => ({
            id: m.msgIndex,
            msg: m.msg,
            senderPk: m.senderPk,
            timestamp: new Date(m.timestamp),
          }))}
        />
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
              onClick={() => onSendMessage()}
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
