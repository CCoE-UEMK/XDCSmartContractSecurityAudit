const hre = require("hardhat");

async function main() {
  const validatorAddress = "Give your own validator address";
  const validator = await hre.ethers.getContractAt("XDCValidator", validatorAddress);
  const [owner] = await hre.ethers.getSigners();

  console.log("Candidates before resign:");
  console.log(await validator.getCandidates());

  const candidateToResign = "0x2222222222222222222222222222222222222222";
  const tx = await validator.resign(candidateToResign);
  await tx.wait();

  console.log("Candidates after resign:");
  console.log(await validator.getCandidates());

  const count = await validator.candidateCount();
  console.log("Candidate count:", count.toString());
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

