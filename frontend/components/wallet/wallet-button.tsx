"use client";

import { Loader2, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { useAccount, useChainId, useConnect, useDisconnect } from "wagmi";

import { Button } from "@/components/ui/button";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connectAsync, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [connectError, setConnectError] = useState<string | null>(null);

  const primaryConnector = useMemo(() => {
    if (connectors.length === 0) {
      return undefined;
    }

    const metamaskConnector = connectors.find((connector) => connector.name.toLowerCase().includes("metamask"));
    return metamaskConnector ?? connectors[0];
  }, [connectors]);

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

  async function handleConnect() {
    setConnectError(null);

    if (!primaryConnector) {
      setConnectError("No se detecto wallet. Instala MetaMask y recarga.");
      return;
    }

    try {
      await connectAsync({ connector: primaryConnector });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No fue posible conectar la wallet.";
      setConnectError(message);
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleConnect} disabled={isPending} className="gap-2">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
        Conectar wallet
      </Button>
      {connectError && <p className="text-xs text-danger">{connectError}</p>}
    </div>
  );
}
