import { ethers } from "hardhat";

async function main() {
  const contractAddress = process.env.SIGNALFORCE_LEDGER_ADDRESS;
  const postId = process.env.POST_ID;
  const commentId = process.env.COMMENT_ID;
  const commentHash = process.env.COMMENT_HASH;

  if (!contractAddress || !postId || !commentId || !commentHash) {
    throw new Error("Set SIGNALFORCE_LEDGER_ADDRESS, POST_ID, COMMENT_ID and COMMENT_HASH env vars before running.");
  }

  if (!/^0x[a-fA-F0-9]{64}$/.test(commentHash)) {
    throw new Error("COMMENT_HASH must be a 32-byte hex string (0x + 64 hex chars)");
  }

  const [signer] = await ethers.getSigners();
  const contract = await ethers.getContractAt("SignalForceLedger", contractAddress, signer);

  const tx = await contract.recordComment(commentId, postId, commentHash as `0x${string}`);
  const receipt = await tx.wait();

  console.log(`Signer: ${signer.address}`);
  console.log(`Tx hash: ${tx.hash}`);
  console.log(`Block number: ${receipt?.blockNumber ?? "n/a"}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
