"use client";

import { useState } from "react";
import { Provider } from "react-redux";
import { makeStore, type AppStore } from "@/lib/redux/store";
import AuthBootstrap from "./auth-bootstrap";

export default function ReduxProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [store] = useState<AppStore>(() => makeStore());

  return (
    <Provider store={store}>
      <AuthBootstrap />
      {children}
    </Provider>
  );
}