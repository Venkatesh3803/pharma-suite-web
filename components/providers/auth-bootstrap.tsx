"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/lib/redux/hooks";
import { fetchCurrentUser } from "@/lib/redux/slices/authSlice";
import { fetchWorkspace } from "@/lib/redux/slices/workspaceSlice";

export default function AuthBootstrap() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Cookie sessions (HttpOnly) have no JS-visible marker, so always ask the
    // backend. Legacy localStorage sessions keep working through the same call.
    void dispatch(fetchCurrentUser()).then(action => {
      if (fetchCurrentUser.fulfilled.match(action)) {
        void dispatch(fetchWorkspace());
      }
    });
  }, [dispatch]);

  return null;
}