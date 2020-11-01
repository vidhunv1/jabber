import { sendAndConfirmTransaction as realSendAndConfirmTransaction, PublicKey } from '@solana/web3.js'
import type { Account, Connection, Transaction } from '@solana/web3.js'
import YAML from 'json-to-pretty-yaml'

type TransactionNotification = (a: string, b: string) => void

let notify: TransactionNotification = () => undefined

export function onTransaction(callback: TransactionNotification): void {
  notify = callback
}

export async function sendAndConfirmTransaction(
  title: string,
  connection: Connection,
  transaction: Transaction,
  ...signers: Array<Account>
): Promise<void> {
  const when = Date.now()

  const signature = await realSendAndConfirmTransaction(connection, transaction, signers, {
    skipPreflight: true,
    commitment: 'recent',
    preflightCommitment: null,
  })

  const body = {
    time: new Date(when).toString(),
    signature,
    instructions: transaction.instructions.map((i) => {
      return {
        keys: i.keys.map((keyObj) => keyObj.pubkey.toBase58()),
        programId: i.programId.toBase58(),
        data: '0x' + i.data.toString('hex'),
      }
    }),
  }

  notify(title, YAML.stringify(body).replace(/"/g, ''))
}

export async function airdrop(connection: Connection, pubkey: string, lamports: number): Promise<boolean> {
  const pk = new PublicKey(pubkey)

  const initial = await connection.getBalance(pk)
  const expected = initial + lamports

  let retries = 10
  await connection.requestAirdrop(pk, lamports)
  for (;;) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    if (expected === (await connection.getBalance(pk))) {
      return true
    }
    if (--retries <= 0) {
      break
    }
    console.log('Airdrop retry ' + retries)
  }
  throw new Error(`Airdrop of ${lamports} failed`)
}
