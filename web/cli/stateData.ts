// Reads states

import { PublicKey, Connection } from '@solana/web3.js'
import { RPC_URL } from './config'
import { Message, Jabber, Thread, Profile } from '../lib/state'

async function main() {
  const action = process.argv[2]
  const pk = new PublicKey(process.argv[3])
  const connection = new Connection(RPC_URL, 'recent')
  if (action === 'message') {
    const msgData = await connection.getAccountInfo(pk)
    const msg = Message.decode<Message>(Message.schema, Message, msgData.data)
    console.log(JSON.stringify(msg))
  } else if (action === 'jabber') {
    const data = await connection.getAccountInfo(pk)
    const out = Jabber.decode<Jabber>(Jabber.schema, Jabber, data.data)
    console.log(JSON.stringify(out.unregisteredThreadTailPk.toString()))
  } else if (action === 'thread') {
    const data = await connection.getAccountInfo(pk)
    const out = Thread.decode<Thread>(Thread.schema, Thread, data.data)
    if (out.prevThreadU1) console.log('u1Next => ' + out.prevThreadU1.toString())
    if (out.prevThreadU2) console.log('u2Next => ' + out.prevThreadU2.toString())
    if (out.u1) console.log('u1 => ' + out.u1.toString())
    if (out.u2) console.log('u2 => ' + out.u2.toString())
    console.log(JSON.stringify(out))
  } else if (action === 'profile') {
    const data = await connection.getAccountInfo(pk)
    const out = Profile.decode<Profile>(Profile.schema, Profile, data.data)
    console.log(JSON.stringify(out))
  } else {
    console.error('invalid input')
    process.exit(1)
  }
}

main()
  .catch((err) => {
    console.error(err)
  })
  .then(() => process.exit())
