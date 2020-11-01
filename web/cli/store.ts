import { Account, PublicKey } from '@solana/web3.js'
import fs from 'fs'

import { ACCOUNTS_FILE } from './config'

// Get stored wallet
export async function getLocalAccount(pubKey: string): Promise<Account | null> {
  const accountsData = JSON.parse(await fs.promises.readFile(ACCOUNTS_FILE, 'utf-8'))
  for (const v of accountsData.wallets) {
    const wallet = new Account(v)
    if (wallet.publicKey.toBase58() === pubKey) {
      return wallet
    }
  }

  return null
}

// Get stored wallet
export async function getLocalAccounts(): Promise<Account[]> {
  const accountsData = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf-8'))
  const wallets = accountsData.wallets
  const out: Account[] = []
  for (let i = 0; i < wallets.length; i++) {
    const wallet = new Account(wallets[i])
    out.push(wallet)
    console.log(`${i + 1} => ${wallet.publicKey.toBase58()}`)
  }

  return out
}

export async function getLastProgramId(): Promise<PublicKey | null> {
  const accountsData = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf-8'))
  return new PublicKey(accountsData['lastProgramId'])
}
