import {
  BpfLoader,
  Connection,
  LAMPORTS_PER_SOL,
  Account,
  BPF_LOADER_PROGRAM_ID,
  Transaction,
  SystemProgram,
} from '@solana/web3.js'
import fs from 'fs'
import { getLocalAccount, getLocalAccounts, getLastProgramId } from './store'

import readline from 'readline'
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})
import { RPC_URL, PROGRAM_PATH, ACCOUNTS_FILE } from './config'
import { Jabber } from '../lib/state'
import { sendAndConfirmTransaction } from '../lib/solana'

async function estimateProgramCost(connection: Connection, programPath: string) {
  const { feeCalculator } = await connection.getRecentBlockhash()

  const data = await fs.promises.readFile(programPath)

  const NUM_RETRIES = 500 // allow some number of retries
  let fees =
    feeCalculator.lamportsPerSignature * (BpfLoader.getMinNumSignatures(data.length) + NUM_RETRIES) +
    (await connection.getMinimumBalanceForRentExemption(data.length))

  // Calculate the cost of sending the transactions
  fees += feeCalculator.lamportsPerSignature * 100 // wag

  console.log('Min signatures: ' + BpfLoader.getMinNumSignatures(data.length))
  return fees
}

// Deploy the account using payerPK from store.
async function deploy(payerPK?: string) {
  const connection = new Connection(RPC_URL, 'recent')
  const version = await connection.getVersion()
  console.log('Connection to cluster established:', RPC_URL, version)
  let payerAccount = await getLocalAccount(payerPK)
  if (!payerAccount && payerPK) {
    console.log('No account found with ID: ' + payerPK)
    process.exit(1)
  }

  if (!payerPK) {
    // Get the first available account
    const accs = await getLocalAccounts()
    if (accs.length === 0) {
      console.log('No accounts found. Generate an account using sol:accounts:create')
      process.exit(1)
    }

    payerAccount = accs[0]
  }

  console.log('\nPAYER: ' + payerAccount.publicKey)
  const dir = await fs.promises.opendir(PROGRAM_PATH)
  let dirent: any
  while ((dirent = dir.readSync()) !== null) {
    console.log(`Program: ${PROGRAM_PATH}/${dirent.name}`)
    const fee = await estimateProgramCost(connection, `${PROGRAM_PATH}/${dirent.name}`)

    console.log(`COST: ${fee / LAMPORTS_PER_SOL} SOL`)

    const ans =
      RPC_URL.includes('localhost') || RPC_URL.includes('testnet.solana.com') || RPC_URL.includes('devnet.solana.com')
        ? 'Y'
        : await new Promise((resolve) => {
            rl.question('Deploy this program? [Y/N]: ', (name) => {
              resolve(name)
            })
          })

    if (ans === 'Y') {
      console.log('Deploying program...')
      const programSO = await fs.promises.readFile(`${PROGRAM_PATH}/${dirent.name}`)

      const programAccount = new Account()
      await BpfLoader.load(connection, payerAccount, programAccount, programSO, BPF_LOADER_PROGRAM_ID)
      console.log('Program loaded to account', programAccount.publicKey.toBase58())

      // Create the Jabber account
      const jabberAccount = await Jabber.createWithSeed(programAccount.publicKey)
      const lamports = await connection.getMinimumBalanceForRentExemption(Jabber.SPACE)

      const createProfileTx = SystemProgram.createAccountWithSeed({
        fromPubkey: payerAccount.publicKey,
        lamports,
        space: Jabber.SPACE,
        basePubkey: payerAccount.publicKey,
        seed: Jabber.SEED,
        programId: programAccount.publicKey,
        newAccountPubkey: jabberAccount,
      })
      await sendAndConfirmTransaction(
        'createJabberAccount',
        connection,
        new Transaction().add(createProfileTx),
        payerAccount,
      )

      console.log('Jabber account created at: ' + jabberAccount.toString())

      // Write to local store
      const data = fs.readFileSync(ACCOUNTS_FILE, 'utf-8')
      const out = JSON.parse(data)
      out['lastProgramId'] = programAccount.publicKey.toBase58()
      out['jabberAccount'] = jabberAccount.toBase58()
      fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(out), 'utf8')

      // Test sanity
      const accountsData = await getLastProgramId()
      if (accountsData.toBase58() !== programAccount.publicKey.toBase58()) {
        console.log('Something went wrong')
        process.exit(1)
      }
    }
  }
  dir.closeSync()
}

deploy(process.argv[2])
  .then(() => process.exit())
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
