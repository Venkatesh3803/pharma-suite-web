"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/lib/redux/hooks";
import { fetchCurrentUser } from "@/lib/redux/slices/authSlice";
import { fetchWorkspace } from "@/lib/redux/slices/workspaceSlice";
import { getAccessToken } from "@/lib/api";

export default function AuthBootstrap() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (getAccessToken()) {
      void dispatch(fetchCurrentUser()).then(action => {
        if (fetchCurrentUser.fulfilled.match(action)) {
          void dispatch(fetchWorkspace());
        }
      });
    }
  }, [dispatch]);

  return null;
}