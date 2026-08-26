import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  authApi,
  clearAccessToken,
  getAccessToken,
  type AuthResponse,
  type AuthUser,
} from "@/lib/api";

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  status: "idle",
};

export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      return await authApi.me();
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
    } catch (err) {
      // Token may already be invalid — still clear locally.
      return rejectWithValue(err);
    } finally {
      clearAccessToken();
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<AuthResponse>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.status = "authenticated";
    },
    setUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.accessToken = state.accessToken ?? getAccessToken();
      state.status = "authenticated";
    },
    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
      if (state.user) state.status = "authenticated";
    },
    clearSession(state) {
      state.user = null;
      state.accessToken = null;
      state.status = "unauthenticated";
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchCurrentUser.pending, state => {
        state.status = "loading";
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.accessToken = state.accessToken ?? getAccessToken();
        state.status = "authenticated";
      })
      .addCase(fetchCurrentUser.rejected, state => {
        clearAccessToken();
        state.user = null;
        state.accessToken = null;
        state.status = "unauthenticated";
      })
      .addCase(logout.fulfilled, () => ({ ...initialState, status: "unauthenticated" as const }))
      .addCase(logout.rejected, state => {
        clearAccessToken();
        state.user = null;
        state.accessToken = null;
        state.status = "unauthenticated";
      });
  },
});

export const {
  setSession,
  setUser,
  setAccessToken,
  clearSession,
} = authSlice.actions;

export default authSlice.reducer;