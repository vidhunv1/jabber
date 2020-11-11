import { combineReducers, configureStore, getDefaultMiddleware, ThunkAction, Action } from '@reduxjs/toolkit'
import walletSlice, { WALLET_SLICE } from './wallet/walletSlice'
import profileSlice, { PROFILE_SLICE } from './profile/profileSlice'
import threadSlice, { THREAD_SLICE } from './thread/threadSlice'
import messageSlice, { MESSAGE_SLICE } from './message/messageSlice'
import { persistReducer, persistStore } from 'redux-persist'

const appReducers = combineReducers({
  [WALLET_SLICE]: walletSlice,
  [PROFILE_SLICE]: profileSlice,
  [THREAD_SLICE]: threadSlice,
  [MESSAGE_SLICE]: messageSlice,
})

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

const persistedReducer = persistReducer(persistConfig, appReducers)

const store = configureStore({
  reducer: persistedReducer,
  middleware,
})
const persistor = persistStore(store)

export type RootState = ReturnType<typeof appReducers>
export type AppThunk = ThunkAction<void, RootState, unknown, Action<string>>
export { store, persistor }
