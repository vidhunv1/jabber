import { UserProfile, UserProfileType } from './state'
import { PublicKey, Account, Connection, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js'
import { sendAndConfirmTransaction } from './solana'
import { InstructionData, Instruction } from './instruction'

export const deriveUserProfile = async (userPk: PublicKey, programId: PublicKey): Promise<PublicKey> => {
  return PublicKey.createWithSeed(userPk, UserProfile.SEED, programId)
}

export const readUserProfile = async (
  connection: Connection,
  userPk: PublicKey,
  programId: PublicKey,
): Promise<UserProfile | null> => {
  const profileAcc = await deriveUserProfile(userPk, programId)

  const account = await connection.getAccountInfo(profileAcc)
  if (!account) {
    return null
  }

  return UserProfile.decode(UserProfile.schema, UserProfile, account.data)
}

export const setUserProfile = async (
  connection: Connection,
  userAccount: Account,
  programId: PublicKey,
  { lamportsPerMessage, bio, name }: UserProfileType,
): Promise<PublicKey> => {
  const userProfileAccount = await deriveUserProfile(userAccount.publicKey, programId)

  const isProfileExists = (await connection.getAccountInfo(userProfileAccount)) !== null
  if (!isProfileExists) {
    const rentExemption = await connection.getMinimumBalanceForRentExemption(UserProfile.SPACE)
    const createProfileTx = SystemProgram.createAccountWithSeed({
      fromPubkey: userAccount.publicKey,
      lamports: rentExemption,
      space: UserProfile.SPACE,
      basePubkey: userAccount.publicKey,
      seed: UserProfile.SEED,
      programId,
      newAccountPubkey: userProfileAccount,
    })
    await sendAndConfirmTransaction(
      'createUserProfile',
      connection,
      new Transaction().add(createProfileTx),
      userAccount,
    )
    console.log('New profile account created: ' + userProfileAccount)
  }

  const instructionDataBuf = new InstructionData({ lamportsPerMessage, bio, name }).encode()
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: userAccount.publicKey, isSigner: true, isWritable: false },
      { pubkey: userProfileAccount, isSigner: false, isWritable: true },
    ],
    programId,
    data: new Instruction({
      instruction: 'SetUserProfile',
      SetUserProfile: new Uint8Array(instructionDataBuf),
    }).encode(),
  })

  await sendAndConfirmTransaction('SetUserProfile', connection, new Transaction().add(instruction), userAccount)
  return userProfileAccount
}
