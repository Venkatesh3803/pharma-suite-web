import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  subscriptionApi,
  type SelectPlanInput,
  type SubscriptionSnapshot,
} from "@/lib/api";

export interface SubscriptionState {
  snapshot: SubscriptionSnapshot | null;
  status: "idle" | "loading" | "loaded" | "error";
  error: string | null;
}

const initialState: SubscriptionState = {
  snapshot: null,
  status: "idle",
  error: null,
};

export const fetchSubscription = createAsyncThunk<
  SubscriptionSnapshot,
  void,
  { rejectValue: string }
>("subscription/fetch", async (_, { rejectWithValue }) => {
  try {
    return await subscriptionApi.me();
  } catch (err) {
    return rejectWithValue(
      err instanceof Error ? err.message : "Failed to load subscription.",
    );
  }
});

export const selectPlan = createAsyncThunk<
  SubscriptionSnapshot,
  SelectPlanInput,
  { rejectValue: string }
>("subscription/selectPlan", async (input, { rejectWithValue }) => {
  try {
    return await subscriptionApi.selectPlan(input);
  } catch (err) {
    return rejectWithValue(
      err instanceof Error ? err.message : "Failed to update plan.",
    );
  }
});

const subscriptionSlice = createSlice({
  name: "subscription",
  initialState,
  reducers: {
    clearSubscription(state) {
      state.snapshot = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchSubscription.pending, state => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchSubscription.fulfilled, (state, action) => {
        state.snapshot = action.payload;
        state.status = "loaded";
        state.error = null;
      })
      .addCase(fetchSubscription.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload ?? "Failed to load subscription.";
      })
      .addCase(selectPlan.fulfilled, (state, action) => {
        state.snapshot = action.payload;
        state.status = "loaded";
        state.error = null;
      })
      .addCase(selectPlan.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to update plan.";
      });
  },
});

export const { clearSubscription } = subscriptionSlice.actions;

export default subscriptionSlice.reducer;
