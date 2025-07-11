import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserBasicData } from '@/core/types/user';

interface AuthState {
  user: UserBasicData | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserBasicData | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    updateUserProfile: (
      state,
      action: PayloadAction<Partial<UserBasicData>>,
    ) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, updateUserProfile, clearUser } = authSlice.actions;
export default authSlice.reducer;

export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  state.auth.isAuthenticated;
