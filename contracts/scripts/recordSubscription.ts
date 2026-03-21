import { ethers } from "hardhat";

async function main() {
  const contractAddress = process.env.SIGNALFORCE_LEDGER_ADDRESS;
  const creator = process.env.CREATOR_WALLET;
  const amountWei = process.env.SUBSCRIPTION_AMOUNT_WEI;

  if (!contractAddress || !creator || !amountWei) {
    throw new Error("Set SIGNALFORCE_LEDGER_ADDRESS, CREATOR_WALLET and SUBSCRIPTION_AMOUNT_WEI env vars before running.");
  }

  const [signer] = await ethers.getSigners();
  const contract = await ethers.getContractAt("SignalForceLedger", contractAddress, signer);

  const tx = await contract.recordSubscription(creator, {
    value: BigInt(amountWei)
  });
  const receipt = await tx.wait();

  console.log(`Signer: ${signer.address}`);
  console.log(`Tx hash: ${tx.hash}`);
  console.log(`Block number: ${receipt?.blockNumber ?? "n/a"}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
