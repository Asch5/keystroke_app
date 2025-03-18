import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import {
    persistStore,
    persistReducer,
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web
import { combineReducers } from '@reduxjs/toolkit';
import themeReducer from './features/themeSlice';
import authReducer from './features/authSlice';
import userDictionaryReducer from './features/userDictionarySlice';

// Create a root reducer
const rootReducer = combineReducers({
    theme: themeReducer,
    auth: authReducer,
    userDictionary: userDictionaryReducer,
});

// Configuration for redux-persist
const persistConfig = {
    key: 'root',
    storage,
    // You can add blacklist or whitelist here if needed
    // whitelist: ['auth'], // only auth will be persisted
    // blacklist: ['theme'], // theme will not be persisted
};

// Create a persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Import your reducers here
// import userReducer from './features/userSlice';

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    FLUSH,
                    REHYDRATE,
                    PAUSE,
                    PERSIST,
                    PURGE,
                    REGISTER,
                ],
            },
        }),
});

export const persistor = persistStore(store);

// Define RootState type that includes both the root reducer state and PersistPartial
export type RootState = ReturnType<typeof rootReducer> & {
    _persist: { version: number; rehydrated: boolean };
};
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
