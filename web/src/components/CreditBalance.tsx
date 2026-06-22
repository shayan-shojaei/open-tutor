"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Coins } from "lucide-react";

export function CreditBalance() {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/backend/billing/balance")
      .then((r) => r.json())
      .then((data: { balance?: number }) => setBalance(data.balance ?? 0))
      .catch(() => setBalance(null));
  }, []);

  if (balance === null) return null;

  return (
    <Link href="/billing" className="credit-balance-chip">
      <Coins size={14} />
      <span>{balance} credits</span>
    </Link>
  );
}
