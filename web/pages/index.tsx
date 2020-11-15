import React, { useState, useEffect } from 'react'
import Page from '../components/page'
import Container from '../components/container'
import { PublicKey, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Avatar } from '../components/chat/avatar'
import Threads from '../components/chat/threads'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store'
import { useRouter } from 'next/router'
import { persistor } from '../store'
import _find from 'lodash/find'
import { ProfileState } from '../store/profile/profileSlice'
import Link from 'next/link'
import appConfig from '../config'
import { firstSyncAll } from '../store/thread/threadSlice'
import Spinner from '../components/spinner'
import { useNewThreadSubsription } from '../store/thread/threadHooks'

const formatPk = (pk: PublicKey) => {
  const s = pk.toString()
  return `${s.substr(0, 4)}..${s.substr(s.length - 4, 4)}`
}

const Dropdown = ({ pk }: { pk: PublicKey }) => {
  const [bal, setBal] = useState<number | null>(null)
  useEffect(() => {
    const connection = new Connection(appConfig.rpcUrl, 'recent')
    connection.getAccountInfo(pk).then((res) => {
      if (res) {
        setBal(res.lamports / LAMPORTS_PER_SOL)
      }
    })
  })
  const router = useRouter()
  const signout = async () => {
    await persistor.purge()
    localStorage.clear()
    router.push('/init')
  }

  return (
    <div className="origin-top-right absolute right-0 top-0 mt-12 mr-4 w-64 rounded-md shadow-lg">
      <div className="rounded-md bg-white shadow-xs">
        <div className="px-4 py-2 text-sm leading-5 flex justify-center">
          <span className="text-gray-600  w-24">Address</span>
          <span className="text-gray-900  w-24">
            <a
              className="py-2 text-sm leading-5 hover:underline text-gray-800"
              href={`https://explorer.solana.com/address/${pk.toString()}`}
            >
              {formatPk(pk)}
            </a>
          </span>
        </div>
        {bal != null && (
          <div className="px-4 py-2 text-sm leading-5 flex justify-center">
            <span className="text-gray-600 w-24">Balance</span>
            <span className="text-gray-900  w-24">{bal.toFixed(2)} SOL</span>
          </div>
        )}
        <div className="" role="menu" aria-orientation="vertical" aria-labelledby="options-menu"></div>

        <Link href="/profile">
          <a
            className="block w-full text-center py-2 text-gray-600 text-sm leading-5  hover:bg-gray-200 focus:outline-none focus:bg-gray-100 cursor-pointer"
            role="menuitem"
          >
            Profile
          </a>
        </Link>
        <button
          type="submit"
          className="block w-full text-center py-2 text-red-600 text-sm leading-5  hover:bg-gray-200 focus:outline-none focus:bg-gray-100"
          role="menuitem"
          onClick={signout}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}

const Header = ({ userPk }: { userPk: PublicKey }) => {
  const [dropdown, setDropdown] = useState(false)
  return (
    <header className="text-black h-16 flex items-center justify-between border-b border-gray-300 px-2 relative">
      <div className="flex">
        <h2 className="text-2xl">Chats</h2>
        <div className="text-xs text-gray-500 border border-green-400 text-center rounded-full h-5 px-2 mt-2 ml-2 pt-px">
          {appConfig.rpcUrl.replace('https://', '')}
        </div>
      </div>
      <div onClick={() => setDropdown(!dropdown)}>
        <Avatar
          className="w-10 h-10 cursor-pointer"
          seed={userPk.toString()}
          aria-haspopup="true"
          aria-expanded="true"
        />
      </div>
      {dropdown && <Dropdown pk={userPk} />}
    </header>
  )
}

const Home = () => {
  useNewThreadSubsription()
  const dispatch = useDispatch()
  const router = useRouter()
  const [search, setSearch] = useState<string>('')
  const userPk = useSelector<RootState, string | null>((s) => s.wallet.publicKey)
  const myProfile = useSelector<RootState, ProfileState | null>((s) =>
    _find(s.profile, { userPk: userPk == null ? null : userPk }),
  )
  const isThreadsSynced = useSelector<RootState, boolean>((s) => s.thread.isFirstSynced)
  useEffect(() => {
    if (!isThreadsSynced && userPk != null) {
      console.log('Syncing first time')
      dispatch(firstSyncAll(new PublicKey(userPk)))
    }
  }, [isThreadsSynced, userPk, dispatch])
  if (userPk == null) {
    router.push('/init')
    return <></>
  }

  if (myProfile == null) {
    router.push('/profile')
    return <></>
  }

  return (
    <Page>
      <Container>
        <div>
          <Header userPk={new PublicKey(userPk)} />
          <div className="px-3 py-2">
            <input
              className="bg-gray-200 appearance-none border-1 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-gray-200 focus:border-gray-400"
              type="text"
              placeholder="Search"
              onChange={(e) => setSearch(e.target.value)}
              value={search}
            ></input>
          </div>

          {isThreadsSynced ? (
            <div className="overflow-y-scroll" style={{ height: '78vh' }}>
              <Threads query={search} />
            </div>
          ) : (
            <div className="w-full h-full mt-48 text-center text-gray-600 flex justify-center">
              <Spinner />
              <span className="ml-3 -mt-px">Syncing your messages</span>
            </div>
          )}
        </div>
      </Container>
    </Page>
  )
}

export default Home
