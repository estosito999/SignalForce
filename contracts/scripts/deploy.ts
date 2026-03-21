import { ethers } from "hardhat";

async function main() {
  const contractFactory = await ethers.getContractFactory("SignalForceLedger");
  const contract = await contractFactory.deploy();

  await contract.waitForDeployment();

  console.log(`SignalForceLedger deployed at: ${await contract.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
