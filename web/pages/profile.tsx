import React, { useState } from 'react'
import Page from '../components/page'
import Container from '../components/container'
import _find from 'lodash/find'
import _get from 'lodash/get'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store'
import { ProfileState } from '../store/profile/profileSlice'
import { useRouter } from 'next/router'
import { Avatar } from '../components/chat'
import { saveProfile } from '../store/profile/profileSlice'
import { WalletState } from '../store/wallet/walletSlice'
import { Account, LAMPORTS_PER_SOL } from '@solana/web3.js'
import cn from 'classnames'
import BN from 'bn.js'

const Header = () => {
  return (
    <header className="text-black h-16 flex items-center justify-between border-b border-gray-300 px-2 relative">
      <h2 className="text-xl">Profile</h2>
    </header>
  )
}

const Profile = () => {
  const wallet = useSelector<RootState, WalletState>((s) => s.wallet)
  const myProfile = useSelector<RootState, ProfileState | null>((s) =>
    _find(s.profile, { userPk: wallet.publicKey == null ? null : wallet.publicKey.toString() }),
  )
  const dispatch = useDispatch()
  const [name, setName] = useState(_get(myProfile, 'name', ''))
  const [bio, setBio] = useState(_get(myProfile, 'bio', ''))
  const [price, setPrice] = useState(parseFloat(_get(myProfile, 'lamportsPerMessage', '0.0')) / LAMPORTS_PER_SOL + '')
  const [isLoading, setLoading] = useState(false)
  const [isError, setError] = useState(false)

  const router = useRouter()

  if (wallet == null || wallet.publicKey == null) {
    router.push('/init')
    return <></>
  }

  const onSave = async () => {
    setError(false)
    const account = new Account(new Uint8Array(JSON.parse(`[${wallet.secretKey.toString()}]`)))
    const lamportsPerMessage = price === '' ? 0 : parseFloat(price) * LAMPORTS_PER_SOL
    setLoading(true)
    try {
      await dispatch(saveProfile(account, name, bio, new BN(lamportsPerMessage)))
      router.push('/')
    } catch (e) {
      console.error('Error saving profile', JSON.stringify(e))
      setError(true)
      setLoading(false)
    }
  }

  return (
    <Page>
      <Container>
        <Header />
        <div className="flex flex-col items-center mt-4">
          <Avatar
            className="w-24 h-24 mb-4"
            seed={wallet.publicKey.toString()}
            aria-haspopup="true"
            aria-expanded="true"
          />
          <div className="w-3/4">
            <div className="block text-gray-700 font-bold mb-2 mt-4 ml-2 text-sm">Account</div>
            <div className="text-sm text-gray-800 mb-8">{wallet.publicKey.toString()}</div>

            <label className="block text-gray-700 font-bold mb-2 ml-2 text-sm">Name</label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none"
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
            />

            <label className="block text-gray-700 font-bold mb-2 mt-4 ml-2 text-sm">Bio</label>
            <textarea
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none"
              id="name"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Bio"
            />

            <label className="block text-gray-700 font-bold mt-4 ml-2 text-sm">
              Your price per message (in{' '}
              <a className="text-blue-600" href="https://coinmarketcap.com/currencies/solana/">
                SOL
              </a>
              )
            </label>
            <span className="pl-2 text-xs text-gray-500">(Earn SOLs for every message you receive)</span>
            <input
              className="mt-2 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none"
              id="name"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Price"
            />

            <div className={cn('mt-8 text-xs text-red-500 mb-2', { invisible: !isError })}>Error saving profile</div>
            <button
              className={cn(
                'px-16 py-2 uppercase text-white font-bold focus:outline-none',
                isLoading ? 'bg-gray-400' : 'bg-green-700',
              )}
              onClick={onSave}
            >
              Save
            </button>
          </div>
        </div>
      </Container>
    </Page>
  )
}

export default Profile
