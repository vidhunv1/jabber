import { setUserProfile, sendMessage, getMessages, getThreads } from '../lib/jabber'
import { Connection, PublicKey, Account, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { RPC_URL } from './config'
import { getLocalAccounts, getLocalAccount, getLastProgramId } from './store'
import BN from 'bn.js'
import { sendAndConfirmTransaction } from '../lib/solana'
import _uniqBy from 'lodash/uniqBy'
const parseAccountAndProgram = async (
  arg1: string,
  arg2: string,
): Promise<{ userAccount: Account; programPk: PublicKey }> => {
  const userPubKey = arg1
  const programId = arg2
  let userAccount: Account | null
  let programPk: PublicKey | null
  if (!userPubKey) {
    userAccount = (await getLocalAccounts())[0]
  } else {
    userAccount = await getLocalAccount(userPubKey)
  }
  if (!programId) {
    programPk = await getLastProgramId()
  } else {
    programPk = new PublicKey(programId)
  }

  if (!userAccount || !programPk) {
    console.error('Invalid input')
    process.exit(1)
  }

  return { programPk, userAccount }
}

const getLamports = async (connection: Connection, a: PublicKey): Promise<number> => {
  const data = await connection.getAccountInfo(a)
  return data != null ? data.lamports : 0
}
async function main() {
  const action = process.argv[2]
  const connection = new Connection(RPC_URL, 'recent')
  if (action === 'setProfile') {
    // argv[3] - public key of payer from local store. Should have enough lamports to pay for fees.
    // argv[4] - public key for the program account.
    const { userAccount, programPk } = await parseAccountAndProgram(process.argv[3], process.argv[4])

    if (!userAccount) {
      throw new Error('Account not found')
    }

    console.log('Running program at: ' + programPk.toBase58())

    const tx = await setUserProfile(connection, userAccount, programPk, {
      lamportsPerMessage: new BN(100000),
      bio: "Hey I'm Al Paca",
      name: 'Al Paca',
    })

    await sendAndConfirmTransaction('SetUserProfile', connection, tx, userAccount)
  } else if (action === 'sendMessage') {
    if (!process.argv[3] || !process.argv[4]) {
      console.error('sendMessage <msg> <to_public_key> <from_public_key?> <program_id?>')
      process.exit(1)
    }
    const { userAccount, programPk } = await parseAccountAndProgram(process.argv[5], process.argv[6])
    const ownerAcc = (await getLocalAccounts())[0]
    const prevBalance = await getLamports(connection, userAccount.publicKey)
    const receiverPk = new PublicKey(process.argv[4])
    console.log(`Sending message from: ${userAccount.publicKey.toString()}, to: ${receiverPk.toString()}`)
    const tx = await sendMessage(
      connection,
      ownerAcc.publicKey,
      userAccount,
      receiverPk,
      programPk,
      process.argv[3],
      10,
    )
    await sendAndConfirmTransaction('SendMessage', connection, tx, userAccount)

    console.log(
      `\nTotal cost: ${(prevBalance - (await getLamports(connection, userAccount.publicKey))) / LAMPORTS_PER_SOL} SOL`,
    )
  } else if (action === 'getMessages') {
    if (!process.argv[3]) {
      console.error('getMessages <receiver_pk> <sender_pk?> <program_id>')
    }
    const rPk = new PublicKey(process.argv[3])
    const { userAccount, programPk } = await parseAccountAndProgram(process.argv[4], process.argv[5])
    console.log(`Getting messages for: ${userAccount.publicKey.toString()}`)

    const revLimit = 10
    const msgs = await getMessages(connection, userAccount.publicKey, rPk, programPk, revLimit)

    msgs.forEach((msg) => {
      if (msg) {
        console.log(`${msg.id}: ${msg.isOwnMsg} ${msg.msg.msg},  at ${msg.msg.timestamp.toString(10)}`)
      } else {
        console.log(`${msg.id}: Deleted`)
      }
    })
  } else if (action === 'getThreads') {
    const { userAccount, programPk } = await parseAccountAndProgram(process.argv[3], process.argv[4])
    console.log('Getting threads for: ' + userAccount.publicKey.toString())
    const threadsCur = await getThreads(connection, userAccount.publicKey, programPk, 'current')
    const threadsPre = await getThreads(connection, userAccount.publicKey, programPk, 'pre')
    console.log(`Pre: ${threadsPre.length}, Cur: ${threadsCur.length}`)

    const threads = _uniqBy([...threadsPre, ...threadsCur], 'pk')
    threads.forEach((t, i) => console.log(`${i}: ${t.thread.u1.toString()} <==> ${t.thread.u2.toString()}`))
  } else if (action === 'scratch') {
    const { userAccount, programPk } = await parseAccountAndProgram(process.argv[3], process.argv[4])
    console.log('Pre threads for: ' + userAccount.publicKey.toString())
    const threads = await getThreads(connection, userAccount.publicKey, programPk, 'pre')
    console.log('THREADs: ' + JSON.stringify(threads))
  } else {
    console.log('Wrong command')
  }
}

main()
  .catch((err) => {
    console.error(err)
  })
  .then(() => process.exit())
