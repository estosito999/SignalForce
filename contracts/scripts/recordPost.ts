import { ethers } from "hardhat";

async function main() {
  const contractAddress = process.env.SIGNALFORCE_LEDGER_ADDRESS;
  const postId = process.env.POST_ID;
  const postHash = process.env.POST_HASH;

  if (!contractAddress || !postId || !postHash) {
    throw new Error("Set SIGNALFORCE_LEDGER_ADDRESS, POST_ID and POST_HASH env vars before running.");
  }

  if (!/^0x[a-fA-F0-9]{64}$/.test(postHash)) {
    throw new Error("POST_HASH must be a 32-byte hex string (0x + 64 hex chars)");
  }

  const [signer] = await ethers.getSigners();
  const contract = await ethers.getContractAt("SignalForceLedger", contractAddress, signer);

  const tx = await contract.recordPost(postId, postHash as `0x${string}`);
  const receipt = await tx.wait();

  console.log(`Signer: ${signer.address}`);
  console.log(`Tx hash: ${tx.hash}`);
  console.log(`Block number: ${receipt?.blockNumber ?? "n/a"}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
