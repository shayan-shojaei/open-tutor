"use client";

import { createContext, useContext } from "react";
import type { DataProvider } from "./DataProvider";
import { LocalProvider } from "./LocalProvider";
import { HostedProvider } from "./HostedProvider";

export type { DataProvider } from "./DataProvider";

export function createDataProvider(): DataProvider {
  if (process.env.NEXT_PUBLIC_APP_MODE === "hosted") return new HostedProvider();
  return new LocalProvider();
}

export const DataProviderContext = createContext<DataProvider>(null!);

export function useDataProvider(): DataProvider {
  const ctx = useContext(DataProviderContext);
  if (!ctx) throw new Error("useDataProvider must be used within DataProviderWrapper");
  return ctx;
}
