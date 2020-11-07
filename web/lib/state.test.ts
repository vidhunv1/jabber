import { PublicKey } from '@solana/web3.js'
import { Message, Thread, Profile } from './state'

test('Message state', async () => {
  const s = new PublicKey('3Z1V7T4FhM7QtVw1rhLVxbG9u8x746piwdjGxNCh1Z4G')
  const r = new PublicKey('F3SfxfnqRbKzSpqPeQwjRjPkVYRWJFWtn9QCwJdQkB7e')
  const p = new PublicKey('C2YF8Uv99MauhyrLqzsZyY2bM5KonJdyJVgkqw48XyEU')
  const i = 1

  const msgPk = (await Message.createWithSeed(i, s, r, p)).toString()
  expect(msgPk.toString()).toEqual('7cgVg22X1kXcWJW7MGB9c44YLS8GyWnfTvq9GskhvW1L')
})

test('Thread state', async () => {
  const s = new PublicKey('2nnNSJWs4EEDJYq3nVxLwW6f2dPW6FwZpn41Wq1nXhuC')
  const r = new PublicKey('3gX3h2ugH6yfowvSPvq6XLuhmV5Qu1arpv5hYFRMUChx')
  const p = new PublicKey('Dk8Kq6DWSyQ26bEhFufGBQVKbNiKsuUZx5pDkzkaj5vw')

  const threadPk = (await Thread.createWithSeed(s, r, p)).toString()
  expect(threadPk.toString()).toEqual('46gz67NL2kghqyCdWdQUqXhRJeFAdhWhx74DuHVTsyXo')
})

test('Profile state', async () => {
  const s = new PublicKey('2KCQaCfVkgZCSW2BVNneMkee5dNJoCU4LuLcWewkYR39')
  const p = new PublicKey('6J2pvdgEaKtcaJWyTKrAGHWtZkp5M1MBELaQ6CcVPvGg')

  const profilePk = (await Profile.createWithSeed(s, p)).toString()
  expect(profilePk.toString()).toEqual('CAiKsBfwJz4FVbMYgrXLVWWkH8tDkSRF84TWeJtMkDpJ')
})
