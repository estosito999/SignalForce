import { createConfig, fallback, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected, metaMask } from "wagmi/connectors";

const sepoliaRpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://rpc.sepolia.org";

export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [metaMask(), injected({ shimDisconnect: true })],
  transports: {
    [sepolia.id]: fallback([
      http(sepoliaRpcUrl, { timeout: 12_000 }),
      http("https://ethereum-sepolia-rpc.publicnode.com", { timeout: 12_000 }),
      http("https://sepolia.gateway.tenderly.co", { timeout: 12_000 })
    ])
  }
});
