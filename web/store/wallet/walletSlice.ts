import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export const WALLET_SLICE = 'wallet'
export interface WalletState {
  secretKey: string | null
  publicKey: string | null
}

const initialState: WalletState = {
  secretKey: null,
  publicKey: null,
}

const walletSlice = createSlice({
  name: WALLET_SLICE,
  initialState,
  reducers: {
    setWallet(state, action: PayloadAction<Pick<WalletState, 'secretKey' | 'publicKey'>>) {
      state.publicKey = action.payload.publicKey
      state.secretKey = action.payload.secretKey
    },
  },
})

export const { setWallet } = walletSlice.actions
export default walletSlice.reducer
