import { setUserProfile } from '../lib/jabber'
import { Connection, PublicKey, Account } from '@solana/web3.js'
import { RPC_URL } from './config'
import { getLocalAccounts, getLocalAccount, getLastProgramId } from './store'
import BN from 'bn.js'

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

    const profileAccount = await setUserProfile(connection, userAccount, programPk, {
      lamportsPerMessage: new BN(100000),
      bio: "Hey I'm Al Paca",
      name: 'Al Paca',
    })
    console.log('Profile account: ' + profileAccount.toString())
  } else {
    console.log('Wrong command')
  }
}

main()
  .catch((err) => {
    console.error(err)
  })
  .then(() => process.exit())
