"use client";

import { createContext, useContext } from "react";
import type { DataProvider } from "./DataProvider";
import { LocalProvider } from "./LocalProvider";

export type { DataProvider } from "./DataProvider";

export function createDataProvider(): DataProvider {
  // Hosted mode lives in the private open-tutor-hosted repo, which supplies its
  // own HostedProvider. The open-source build is local-only.
  if (process.env.NEXT_PUBLIC_APP_MODE === "hosted") {
    throw new Error("Hosted mode is not available in the open-source build");
  }
  return new LocalProvider();
}

export const DataProviderContext = createContext<DataProvider>(null!);

export function useDataProvider(): DataProvider {
  const ctx = useContext(DataProviderContext);
  if (!ctx) throw new Error("useDataProvider must be used within DataProviderWrapper");
  return ctx;
}
