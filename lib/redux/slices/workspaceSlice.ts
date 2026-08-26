import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  organizationApi,
  type UpdateWorkspaceInput,
  type Workspace,
} from "@/lib/api";

export interface WorkspaceState {
  workspace: Workspace | null;
  status: "idle" | "loading" | "loaded" | "error";
  error: string | null;
}

const initialState: WorkspaceState = {
  workspace: null,
  status: "idle",
  error: null,
};

export const fetchWorkspace = createAsyncThunk<
  Workspace,
  void,
  { rejectValue: string }
>(
  "workspace/fetch",
  async (_, { rejectWithValue }) => {
    try {
      return await organizationApi.getWorkspace();
    } catch (err) {
      return rejectWithValue(
        err instanceof Error ? err.message : "Failed to load workspace.",
      );
    }
  },
);

export const updateWorkspace = createAsyncThunk<
  Workspace,
  UpdateWorkspaceInput,
  { rejectValue: string }
>(
  "workspace/update",
  async (input, { rejectWithValue }) => {
    try {
      return await organizationApi.updateWorkspace(input);
    } catch (err) {
      return rejectWithValue(
        err instanceof Error ? err.message : "Failed to update workspace.",
      );
    }
  },
);

const workspaceSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    clearWorkspace(state) {
      state.workspace = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchWorkspace.pending, state => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchWorkspace.fulfilled, (state, action) => {
        state.workspace = action.payload;
        state.status = "loaded";
        state.error = null;
      })
      .addCase(fetchWorkspace.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload ?? "Failed to load workspace.";
      })
      .addCase(updateWorkspace.pending, state => {
        state.error = null;
      })
      .addCase(updateWorkspace.fulfilled, (state, action) => {
        state.workspace = action.payload;
        state.status = "loaded";
        state.error = null;
      })
      .addCase(updateWorkspace.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to update workspace.";
      });
  },
});

export const { clearWorkspace } = workspaceSlice.actions;

export default workspaceSlice.reducer;
