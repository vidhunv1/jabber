import { PublicKey, Connection, Account } from '@solana/web3.js'
import fs from 'fs'

import { RPC_URL, STORE_PATH, ACCOUNTS_FILE } from './config'
import { getLocalAccounts } from './store'
import { airdrop } from '../lib/solana'

// Get the public info for an account pk.
async function accountInfo(pubkey: string) {
  if (!pubkey) {
    console.log('No account supplied')
    process.exit(1)
  }

  console.log('Account Info: ', pubkey)
  const connection = new Connection(RPC_URL, 'recent')
  const pk = new PublicKey(pubkey)
  const account = await connection.getAccountInfo(pk)
  if (!account) {
    console.log('Account not found on chain')
    process.exit(1)
  }
  console.log(account)

  // @ts-ignore
  const owner = new PublicKey(account.owner._bn)
  console.log('Owner PubKey:', owner.toString())
}

async function createLocalAccount() {
  if (!fs.existsSync(STORE_PATH)) {
    console.log(`Creating ${STORE_PATH}...`)
    fs.mkdirSync(STORE_PATH, { recursive: true })
    fs.writeFileSync(ACCOUNTS_FILE, '{ "wallets": [] }', 'utf8')
  }

  // read the local file
  const data = fs.readFileSync(ACCOUNTS_FILE, 'utf-8')
  console.log('Generating new account...')
  const wallet = new Account()
  const pk = wallet.publicKey.toBase58()
  const tmpArr = []
  for (const p in Object.getOwnPropertyNames(wallet.secretKey)) {
    tmpArr[p] = wallet.secretKey[p]
  }
  const out = JSON.parse(data)
  out.wallets.push(tmpArr)
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(out), 'utf8')

  // Test sanity
  const accountsData = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf-8'))
  const lastAccount = new Account(accountsData.wallets[accountsData.wallets.length - 1])

  if (lastAccount.publicKey.toBase58() !== pk) {
    console.log('Something went wrong')
    process.exit(1)
  }

  console.log('Created account: ', pk)
}

async function main() {
  const connection = new Connection(RPC_URL, 'recent')

  const action = process.argv[2]
  if (action === 'info') {
    const pubkey = process.argv[3]
    await accountInfo(pubkey)
  } else if (action === 'airdrop') {
    const accs = await getLocalAccounts()
    for (let i = 0; i < accs.length; i++) {
      console.log('Airropping:', accs[i].publicKey.toString())
      await airdrop(connection, accs[i].publicKey.toString(), 1000000)
    }
  } else if (action === 'create') {
    await createLocalAccount()
  } else if (action === 'list') {
    const accs = await getLocalAccounts()
    accs.forEach((wallet, i) => console.log(`${i + 1} => ${wallet.publicKey.toBase58()}`))
  } else {
    console.log('Wrong command')
  }
}

main()
  .catch((err) => {
    console.error(err)
  })
  .then(() => process.exit())
