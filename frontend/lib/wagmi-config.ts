import { createConfig, fallback, http } from "wagmi";
import { hardhat, sepolia } from "wagmi/chains";
import { injected, metaMask } from "wagmi/connectors";

const hardhatRpcUrl = process.env.NEXT_PUBLIC_HARDHAT_RPC_URL || "http://127.0.0.1:8545";
const sepoliaRpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://rpc.sepolia.org";

export const wagmiConfig = createConfig({
  chains: [hardhat, sepolia],
  connectors: [metaMask(), injected({ shimDisconnect: true })],
  transports: {
    [hardhat.id]: http(hardhatRpcUrl),
    [sepolia.id]: fallback([
      http(sepoliaRpcUrl, { timeout: 12_000 }),
      http("https://ethereum-sepolia-rpc.publicnode.com", { timeout: 12_000 }),
      http("https://sepolia.gateway.tenderly.co", { timeout: 12_000 })
    ])
  }
});
