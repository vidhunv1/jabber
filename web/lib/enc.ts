import ed2curve from '../lib/ed2curve'
import nacl from 'tweetnacl'
import { Account, PublicKey } from '@solana/web3.js'

export const encryptMessage = (
  msg: Uint8Array,
  sAccount: Account,
  rPublicKey: PublicKey,
  nonce: Uint8Array,
): Uint8Array => {
  const dhKeys = ed2curve.convertKeyPair({ publicKey: sAccount.publicKey.toBuffer(), secretKey: sAccount.secretKey })
  const dhrPk = ed2curve.convertPublicKey(rPublicKey)
  return nacl.box(msg, nonce, dhrPk, dhKeys.secretKey)
}

export const decryptMessage = (msg: Uint8Array, account: Account, fromPk: PublicKey, nonce: Uint8Array): Uint8Array => {
  const dhKeys = ed2curve.convertKeyPair({ publicKey: account.publicKey.toBuffer(), secretKey: account.secretKey })
  const dhrPk = ed2curve.convertPublicKey(fromPk)
  return nacl.box.open(msg, nonce, dhrPk, dhKeys.secretKey)
}
