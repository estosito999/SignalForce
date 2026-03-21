"use client";

import { Loader2, Wallet } from "lucide-react";
import { useAccount, useChainId, useConnect, useDisconnect } from "wagmi";

import { Button } from "@/components/ui/button";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const primaryConnector = connectors[0];

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs text-muted-foreground">
          Red: {chainId}
        </span>
        <Button variant="outline" onClick={() => disconnect()}>
          {shortenAddress(address)}
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={() => {
        if (!primaryConnector) {
          return;
        }
        connect({ connector: primaryConnector });
      }}
      disabled={isPending || !primaryConnector}
      className="gap-2"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
      Conectar wallet
    </Button>
  );
}
