const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const Validator = await hre.ethers.getContractFactory("XDCValidator");
  const validator = await Validator.deploy(
    [], // _candidates
    [], // _caps
    deployer.address, // _firstOwner
    hre.ethers.parseEther("1"), // _minCandidateCap
    hre.ethers.parseEther("0.5"), // _minVoterCap
    21, // _maxValidatorNumber
    3,  // _candidateWithdrawDelay
    3   // _voterWithdrawDelay
  );

  await validator.waitForDeployment();
  const validatorAddr = await validator.getAddress();
  console.log("✅ XDCValidator deployed at:", validatorAddr);

  fs.writeFileSync("deployed-validator.json", JSON.stringify({ validator: validatorAddr }, null, 2));
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});

