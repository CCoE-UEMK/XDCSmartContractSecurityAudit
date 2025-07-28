const hre = require("hardhat");

async function main() {
  const validatorAddress = "GIVE YOUR OWN VALIDATOR ADDRESS";
  const validator = await hre.ethers.getContractAt("XDCValidatorV2", validatorAddress);

  const candidateToResign = "0x2222222222222222222222222222222222222222";

  // We'll impersonate the owner of this candidate
  // In your deploy.js, you set the deployer as owner of all 3 candidates
  const [deployer] = await hre.ethers.getSigners(); // ← This is the actual owner!

  console.log("Calling resign as:", await deployer.getAddress());
  console.log("Owner of candidate:", await validator.getCandidateOwner(candidateToResign));

  // Confirm ownership before resigning
  const tx = await validator.connect(deployer).resign(candidateToResign);
  await tx.wait();

  console.log("✅ Resign successful");

  const candidatesAfter = await validator.getCandidates();
  console.log("Candidates after resign:", candidatesAfter);

  const count = await validator.candidateCount();
  console.log("Candidate count:", count.toString());
}

main().catch((error) => {
  console.error("❌", error);
  process.exitCode = 1;
});

