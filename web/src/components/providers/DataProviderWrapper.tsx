"use client";

import { useMemo } from "react";
import { DataProviderContext, createDataProvider } from "@/lib/data";

export function DataProviderWrapper({ children }: { children: React.ReactNode }) {
  const provider = useMemo(() => createDataProvider(), []);
  return (
    <DataProviderContext.Provider value={provider}>
      {children}
    </DataProviderContext.Provider>
  );
}
