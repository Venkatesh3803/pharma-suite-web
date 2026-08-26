import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/lib/redux/slices/authSlice";
import workspaceReducer from "@/lib/redux/slices/workspaceSlice";
import teamReducer from "@/lib/redux/slices/teamSlice";
import subscriptionReducer from "@/lib/redux/slices/subscriptionSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      workspace: workspaceReducer,
      team: teamReducer,
      subscription: subscriptionReducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];