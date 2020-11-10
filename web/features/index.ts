import { combineReducers, configureStore, getDefaultMiddleware, ThunkAction, Action } from '@reduxjs/toolkit'
import walletSlice, { WALLET_SLICE } from './wallet/walletSlice'
import profileSlice, { PROFILE_SLICE } from './profile/profileSlice'
import { persistReducer, persistStore } from 'redux-persist'

import storage from 'redux-persist/lib/storage'
const middleware = [
  ...getDefaultMiddleware({
    serializableCheck: false,
  }),
]
const persistConfig = {
  key: 'root',
  storage,
}

const appReducers = combineReducers({
  [WALLET_SLICE]: walletSlice,
  [PROFILE_SLICE]: profileSlice,
})

const persistedReducer = persistReducer(persistConfig, appReducers)

const store = configureStore({
  reducer: persistedReducer,
  middleware,
})
const persistor = persistStore(store)

export type RootState = ReturnType<typeof appReducers>
export type AppThunk = ThunkAction<void, RootState, unknown, Action<string>>
export { store, persistor }
