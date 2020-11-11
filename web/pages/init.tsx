import React, { useState } from 'react'
import Page from '../components/page'
import Container from '../components/container'
import { setWallet } from '../store/wallet/walletSlice'
import { useDispatch } from 'react-redux'
import { Account } from '@solana/web3.js'
import { useRouter } from 'next/router'

const Init = () => {
  const [secretKey, setSecretKey] = useState('')
  const [isError, setError] = useState(false)
  const dispatch = useDispatch()
  const router = useRouter()

  const downloadTxtFile = (text: string) => {
    const element = document.createElement('a')
    const file = new Blob([text], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = 'SECRET-KEY_keep_secure.txt'
    document.body.appendChild(element) // Required for this to work in FireFox
    element.click()
  }

  const createAccount = () => {
    const wallet = new Account()
    dispatch(setWallet({ publicKey: wallet.publicKey.toString(), secretKey: wallet.secretKey.toString() }))
    downloadTxtFile(wallet.secretKey.toString())
    router.push('/profile')
  }

  const loadAccount = () => {
    try {
      const wallet = new Account(new Uint8Array(JSON.parse(`[${secretKey}]`)))
      dispatch(setWallet({ publicKey: wallet.publicKey.toString(), secretKey: wallet.secretKey.toString() }))
      router.push('/profile')
    } catch (e) {
      setError(true)
    }
  }
  return (
    <Page>
      <Container>
        <h1 className="text-5xl text-center pt-16 text-green-900 font-mono">Jabber</h1>
        <h3 className="text-lg px-4 text-center text-gray-700">Secure and decentralised messenger</h3>

        <div className="flex flex-col mt-32 items-center">
          <button
            className="bg-green-700 px-20 py-3 uppercase text-white font-bold max-w-xs w-full focus:outline-none"
            onClick={createAccount}
          >
            Generate account
          </button>

          <div className="w-full text-center text-2xl text-gray-500 my-8">or</div>

          <textarea
            placeholder="Secret key"
            className="mx-auto w-full max-w-xs bg-gray-200 h-32 p-2 rounded-sm border border-gray-400 focus:outline-none focus:border-gray-600"
            value={secretKey}
            onChange={(e) => {
              setError(false)
              setSecretKey(e.target.value)
            }}
          />
          <button
            className="bg-gray-300 shadow-md px-20 py-3 uppercase text-gray-700 font-bold max-w-xs w-full mt-3 focus:outline-none"
            onClick={loadAccount}
          >
            Load Account
          </button>
          {secretKey.length > 0 && isError && <div className="mt-12 text-red-500">Invalid secret key</div>}
        </div>
      </Container>
    </Page>
  )
}

export default Init
