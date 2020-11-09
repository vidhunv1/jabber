import React from 'react'
import { PublicKey } from '@solana/web3.js'
import Avatar from './avatar'
import Threads from './threads'

const threads = [
  {
    name: 'Alice',
    message: {
      participantPk: new PublicKey('2mrWFpShFZs9RkbqUR3tHbwj65cHhHGvp5wh31NtDL5N'),
      lastMessage: 'Hey man!',
      time: new Date(),
      isOwnMsg: true,
    },
  },
  {
    name: 'Bob Dylan',
    message: {
      participantPk: new PublicKey('D2T7LaEp7SgQCZWvxbMfWym6LW2cSfX69oXpFLCDqbVS'),
      lastMessage:
        'The Time Machine is a science fiction novella by H. G. Wells, published in 1895 and written as a frame narrative. The work is generally credited with the popularization of the concept of time travel by using a vehicle or device to travel purposely and selectively forward or backward through time. The term "time machine", coined by Wells, is now almost universally used to refer to such a vehicle or device.',
      time: new Date(),
      isOwnMsg: true,
    },
  },
]

const Header = ({ userPk }: { userPk: PublicKey }) => (
  <header className="text-black h-16 flex items-center justify-between border-b border-gray-300 px-2">
    <h2 className="text-2xl">Chats</h2>
    <Avatar className="w-10 h-10" seed={userPk.toString()} />
  </header>
)

export const ChatHome = () => (
  <div>
    <Header userPk={new PublicKey('D2T7LaEp7SgQCZWvxbMfWym6LW2cSfX69oXpFLCDqbVS')} />
    <div className="px-3 py-2">
      <input
        className="bg-gray-300 appearance-none border-1 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-gray-200 focus:border-gray-400"
        id="inline-full-name"
        type="text"
        placeholder="Search"
        value=""
      />
    </div>
    <Threads list={threads} />
  </div>
)
