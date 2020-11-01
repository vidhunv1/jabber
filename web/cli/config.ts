// import { clusterApiUrl } from '@solana/web3.js'
const RPC_URL = 'http://localhost:8899'
// const RPC_URL = clusterApiUrl('testnet', true) // mainnet-beta, devnet, testnet
console.log(RPC_URL)
const PROGRAM_PATH = '../dist/so'
const STORE_PATH = '../.store'
const ACCOUNTS_FILE = `${STORE_PATH}/accounts.json`

export { RPC_URL, PROGRAM_PATH, STORE_PATH, ACCOUNTS_FILE }
