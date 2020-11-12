import appConfig from '../config'

const RPC_URL = appConfig.rpcUrl
const PROGRAM_PATH = '../dist/so'
const STORE_PATH = '../.store'
const ACCOUNTS_FILE = `${STORE_PATH}/accounts.json`

export { RPC_URL, PROGRAM_PATH, STORE_PATH, ACCOUNTS_FILE }
