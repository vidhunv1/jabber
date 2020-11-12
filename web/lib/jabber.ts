import { Profile, Jabber, Thread, Message, MessageKind, JabberError, JabberErrorType } from './state'
import {
  PublicKey,
  Account,
  Connection,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  SYSVAR_RENT_PUBKEY,
  SYSVAR_CLOCK_PUBKEY,
  LAMPORTS_PER_SOL,
  AccountInfo,
} from '@solana/web3.js'
import { sendAndConfirmTransaction } from './solana'
import { InstructionData, Instruction, InstructionType } from './instruction'
import BN from 'bn.js'
import _get from 'lodash/get'

const readUserProfile = async (
  connection: Connection,
  userPk: PublicKey,
  programId: PublicKey,
): Promise<Profile | null> => {
  const profileAcc = await Profile.createWithSeed(userPk, programId)

  const account = await connection.getAccountInfo(profileAcc)
  if (!account) {
    return null
  }

  return Profile.decode(Profile.schema, Profile, account.data)
}

const readJabber = async (connection: Connection, programId: PublicKey): Promise<Jabber | null> => {
  const pk = await Jabber.createWithSeed(programId)
  const data = await connection.getAccountInfo(pk)

  if (data != null) {
    return Jabber.decode<Jabber>(Jabber.schema, Jabber, data.data)
  }

  return null
}

const readThread = async (
  connection: Connection,
  senderPk: PublicKey,
  receiverPk: PublicKey,
  programId: PublicKey,
): Promise<[Thread, PublicKey] | null> => {
  const sThreadKey = await Thread.createWithSeed(senderPk, receiverPk, programId)
  const rThreadKey = await Thread.createWithSeed(receiverPk, senderPk, programId)

  // TODO: This is always going to be the same for a chat, store/get from cache.
  const sThreadData = await connection.getAccountInfo(sThreadKey)
  const rThreadData = await connection.getAccountInfo(rThreadKey)

  let threadData = null
  let threadPk = null
  if (sThreadData != null) {
    threadData = sThreadData
    threadPk = sThreadKey
  }
  if (rThreadData != null) {
    threadData = rThreadData
    threadPk = rThreadKey
  }

  if (threadData != null) {
    return [Thread.decode<Thread>(Thread.schema, Thread, threadData.data), threadPk]
  }

  return null
}

const readMessage = async (
  connection: Connection,
  index: number,
  senderPk: PublicKey,
  receiverPk: PublicKey,
  programId: PublicKey,
): Promise<Message | null> => {
  const mKey = await Message.createWithSeed(index, senderPk, receiverPk, programId)
  const msgData = await connection.getAccountInfo(mKey)
  if (msgData != null) {
    return Message.decode<Message>(Message.schema, Message, msgData.data)
  }

  return null
}

const readProfile = async (
  connection: Connection,
  userPk: PublicKey,
  programId: PublicKey,
): Promise<Profile | null> => {
  const profilePk = await Profile.createWithSeed(userPk, programId)
  const profileData = await connection.getAccountInfo(profilePk)
  if (profileData != null) {
    return Profile.decode<Profile>(Profile.schema, Profile, profileData.data)
  }
  return null
}

const getMessages = async (
  connection: Connection,
  u1Pk: PublicKey,
  u2Pk: PublicKey,
  programId: PublicKey,
  startIndex?: number,
  endIndex?: number,
): Promise<{ senderPk: PublicKey; msg: Message | null; id: number; pk: PublicKey }[]> => {
  let msgData1: AccountInfo<Buffer>, msgData2: AccountInfo<Buffer>
  const out: { senderPk: PublicKey; msg: Message; id: number; pk: PublicKey }[] = []
  for (let i = startIndex; i <= endIndex; i++) {
    const msg1Pk = await Message.createWithSeed(i, u1Pk, u2Pk, programId)
    const msg2Pk = await Message.createWithSeed(i, u2Pk, u1Pk, programId)
    msgData1 = await connection.getAccountInfo(msg1Pk)
    msgData2 = await connection.getAccountInfo(msg2Pk)

    let msg = null
    if (msgData1) {
      msg = [Message.decode<Message>(Message.schema, Message, msgData1.data), u1Pk]
    } else if (msgData2) {
      msg = [Message.decode<Message>(Message.schema, Message, msgData2.data), u2Pk]
    }

    if (msg) {
      out.push({
        senderPk: msg[1],
        msg: msg[0],
        id: i,
        pk: msg1Pk,
      })
    } else {
      out.push(null)
    }
  }
  return out
}

const getThreads = async (
  connection: Connection,
  senderPk: PublicKey,
  pointer: PublicKey,
  toPointer: PublicKey | null,
  origin: 'pre' | 'curr',
): Promise<{ pk: string; thread: Thread }[]> => {
  const out: { pk: string; thread: Thread }[] = []
  while (pointer != null) {
    if (toPointer != null && pointer.equals(toPointer)) {
      return out
    }
    const threadData = await connection.getAccountInfo(pointer)
    if (threadData != null) {
      const thread = Thread.decode<Thread>(Thread.schema, Thread, threadData.data)
      if (origin === 'pre') {
        if (thread.u1.equals(senderPk) || thread.u2.equals(senderPk)) {
          out.push({ pk: pointer.toString(), thread })
        }
        pointer = thread.prevThreadU2
      } else {
        out.push({ pk: pointer.toString(), thread })
        if (thread.u1.equals(senderPk)) {
          pointer = thread.prevThreadU1
        } else if (thread.u2.equals(senderPk)) {
          pointer = thread.prevThreadU2
        }
      }
    } else {
      pointer = null
    }
  }
  return out
}

const setUserProfile = async (
  connection: Connection,
  userAccount: Account,
  programId: PublicKey,
  { lamportsPerMessage, bio, name }: Pick<Profile, 'bio' | 'lamportsPerMessage' | 'name'>,
): Promise<Transaction> => {
  const userProfileAccount = await Profile.createWithSeed(userAccount.publicKey, programId)

  const isProfileExists = (await connection.getAccountInfo(userProfileAccount)) !== null
  if (!isProfileExists) {
    const rentExemption = await connection.getMinimumBalanceForRentExemption(Profile.SPACE)
    const createProfileTx = SystemProgram.createAccountWithSeed({
      fromPubkey: userAccount.publicKey,
      lamports: rentExemption,
      space: Profile.SPACE,
      basePubkey: userAccount.publicKey,
      seed: Profile.SEED,
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
  } else {
    console.log('Profile account: ' + userProfileAccount)
  }

  const instructionDataBuf = new InstructionData(InstructionType.SetProfile, { lamportsPerMessage, bio, name }).encode()
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: userAccount.publicKey, isSigner: true, isWritable: false },
      { pubkey: userProfileAccount, isSigner: false, isWritable: true },
    ],
    programId,
    data: new Instruction({
      instruction: InstructionType.SetProfile,
      [InstructionType.SetProfile]: new Uint8Array(instructionDataBuf),
    }).encode(),
  })

  return new Transaction().add(instruction)
}

const sendMessage = async (
  connection: Connection,
  senderAccount: Account,
  receiverPk: PublicKey,
  programId: PublicKey,
  msg: string,
  kind: MessageKind,
): Promise<{ tx: Transaction; msgPk: PublicKey; msgIndex: number; threadPk: PublicKey }> => {
  const tx = new Transaction()
  const senderPk = senderAccount.publicKey
  const jabberKey = await Jabber.createWithSeed(programId)
  const sProfileKey = await Profile.createWithSeed(senderPk, programId)
  const rProfileKey = await Profile.createWithSeed(receiverPk, programId)
  const sThreadKey = await Thread.createWithSeed(senderPk, receiverPk, programId)
  const rThreadKey = await Thread.createWithSeed(receiverPk, senderPk, programId)

  // get data for threads
  const sProfileData = await connection.getAccountInfo(sProfileKey)
  if (sProfileData == null) {
    throw new JabberError(JabberErrorType.ProfileNotFound)
  }

  const t = await readThread(connection, senderPk, receiverPk, programId)
  let thread: Thread | null = null
  let threadPk: PublicKey
  if (t) {
    ;[thread, threadPk] = t
  }
  let messageIndex: number
  if (thread == null) {
    messageIndex = 1
    const rentExemption = await connection.getMinimumBalanceForRentExemption(Thread.SPACE)
    console.debug('Chatting for first time, creating thread. cost:', rentExemption / LAMPORTS_PER_SOL)
    const createThreadTx = SystemProgram.createAccountWithSeed({
      fromPubkey: senderAccount.publicKey,
      lamports: rentExemption,
      space: Thread.SPACE,
      basePubkey: senderAccount.publicKey,
      seed: Thread.getSeed(receiverPk),
      programId,
      newAccountPubkey: sThreadKey,
    })
    threadPk = sThreadKey
    tx.add(createThreadTx)
    console.debug('New chat thread created: ' + sThreadKey)
  } else {
    messageIndex = thread.msgCount

    if (messageIndex == 0) {
      messageIndex = 1
    }
  }

  // create the message
  const messageKey = await Message.createWithSeed(messageIndex, senderAccount.publicKey, receiverPk, programId)
  const msgU8 = Message.encodeMessage(
    kind,
    new Uint8Array(Buffer.from(msg, 'utf8')),
    messageKey,
    senderAccount,
    receiverPk,
  )
  // dummy to get byteLength
  const msgDummy = new Message({
    kind,
    msg: msgU8,
    timestamp: new BN(+new Date()),
  }).encode()

  if ((await connection.getAccountInfo(messageKey)) == null) {
    // TODO: Messages need not be rent exempted if permanent storage is not required
    const rentExemption = await connection.getMinimumBalanceForRentExemption(msgDummy.byteLength)
    const createTx = SystemProgram.createAccountWithSeed({
      fromPubkey: senderAccount.publicKey,
      lamports: rentExemption,
      space: msgDummy.byteLength,
      basePubkey: senderAccount.publicKey,
      seed: Message.getSeed(messageIndex, receiverPk),
      programId,
      newAccountPubkey: messageKey,
    })
    tx.add(createTx)
  }

  const instructionDataBuf = new InstructionData(InstructionType.SendMessage, {
    kind,
    msg: msgU8,
  }).encode()
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: senderAccount.publicKey, isSigner: true, isWritable: false },
      { pubkey: receiverPk, isSigner: false, isWritable: false },
      { pubkey: sThreadKey, isSigner: false, isWritable: true },
      { pubkey: rThreadKey, isSigner: false, isWritable: true },
      { pubkey: sProfileKey, isSigner: false, isWritable: true },
      { pubkey: rProfileKey, isSigner: false, isWritable: true },
      { pubkey: messageKey, isSigner: false, isWritable: true },
      { pubkey: jabberKey, isSigner: false, isWritable: true },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
    ],
    programId,
    data: new Instruction({
      instruction: InstructionType.SendMessage,
      [InstructionType.SendMessage]: new Uint8Array(instructionDataBuf),
    }).encode(),
  })

  return { tx: tx.add(instruction), msgPk: messageKey, msgIndex: messageIndex, threadPk }
}

export {
  readUserProfile,
  readJabber,
  readThread,
  readMessage,
  readProfile,
  getMessages,
  setUserProfile,
  sendMessage,
  getThreads,
}
