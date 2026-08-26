import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  usersApi,
  type CreateTeamMemberInput,
  type TeamMember,
  type UpdateTeamMemberInput,
} from "@/lib/api";

export interface TeamState {
  items: TeamMember[];
  status: "idle" | "loading" | "loaded" | "error";
  error: string | null;
}

const initialState: TeamState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchTeam = createAsyncThunk<
  TeamMember[],
  void,
  { rejectValue: string }
>("team/fetch", async (_, { rejectWithValue }) => {
  try {
    const data = await usersApi.list();
    return data.items;
  } catch (err) {
    return rejectWithValue(
      err instanceof Error ? err.message : "Failed to load team members.",
    );
  }
});

export const createTeamMember = createAsyncThunk<
  TeamMember,
  CreateTeamMemberInput,
  { rejectValue: string }
>("team/create", async (input, { rejectWithValue }) => {
  try {
    return await usersApi.create(input);
  } catch (err) {
    return rejectWithValue(
      err instanceof Error ? err.message : "Failed to add team member.",
    );
  }
});

export const updateTeamMember = createAsyncThunk<
  TeamMember,
  { id: string; input: UpdateTeamMemberInput },
  { rejectValue: string }
>("team/update", async ({ id, input }, { rejectWithValue }) => {
  try {
    return await usersApi.update(id, input);
  } catch (err) {
    return rejectWithValue(
      err instanceof Error ? err.message : "Failed to update team member.",
    );
  }
});

const teamSlice = createSlice({
  name: "team",
  initialState,
  reducers: {
    clearTeam(state) {
      state.items = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchTeam.pending, state => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchTeam.fulfilled, (state, action) => {
        state.items = action.payload;
        state.status = "loaded";
        state.error = null;
      })
      .addCase(fetchTeam.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload ?? "Failed to load team members.";
      })
      .addCase(createTeamMember.pending, state => {
        state.error = null;
      })
      .addCase(createTeamMember.fulfilled, (state, action) => {
        state.items = [...state.items, action.payload];
        state.error = null;
      })
      .addCase(createTeamMember.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to add team member.";
      })
      .addCase(updateTeamMember.fulfilled, (state, action) => {
        const updated = action.payload;
        state.items = state.items.map(item =>
          item.id === updated.id ? updated : item,
        );
        state.error = null;
      })
      .addCase(updateTeamMember.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to update team member.";
      });
  },
});

export const { clearTeam } = teamSlice.actions;

export default teamSlice.reducer;
