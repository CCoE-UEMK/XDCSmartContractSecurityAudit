const hre = require("hardhat");
const fs = require("fs");
const { parseEther } = hre.ethers;

async function simulateProgress(label, steps = 10, delay = 300) {
  for (let i = 1; i <= steps; i++) {
    process.stdout.write(`\r${label}... ${i * 10}%`);
    await new Promise(res => setTimeout(res, delay));
  }
  console.log(); // new line
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with:", deployer.address);
  console.log(
    "Balance:",
    hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)),
    "XDC"
  );

  const initialCandidates = [deployer.address];
  const caps = [parseEther("1")];
  const firstOwner = deployer.address;
  const minCandidateCap = parseEther("0.5");
  const minVoterCap = parseEther("0.2");
  const maxValidatorNumber = 5;
  const candidateWithdrawDelay = 3600;
  const voterWithdrawDelay = 1800;

  let validatorAddr, attackAddr;

  try {
    console.log("⏳ Deploying XDCValidatorV2...");
    await simulateProgress("🔧 Deploying XDCValidatorV2");
    const Validator = await hre.ethers.getContractFactory("XDCValidatorV2");
    const validator = await Validator.deploy(
      initialCandidates,
      caps,
      firstOwner,
      minCandidateCap,
      minVoterCap,
      maxValidatorNumber,
      candidateWithdrawDelay,
      voterWithdrawDelay,
      { gasLimit: 6000000 }
    );
    await validator.waitForDeployment();
    validatorAddr = await validator.getAddress();
    console.log("✅ XDCValidator deployed at:", validatorAddr);
  } catch (err) {
    console.error("❌ XDCValidatorV2 deployment failed:", err);
    return;
  }

  try {
    console.log("⏳ Deploying ReentrancyAttack...");
    await simulateProgress("🔧 Deploying ReentrancyAttack");
    const Attack = await hre.ethers.getContractFactory("ReentrancyAttack");
    const attack = await Attack.deploy(validatorAddr, { gasLimit: 3000000 });
    await attack.waitForDeployment();
    attackAddr = await attack.getAddress();
    console.log("✅ ReentrancyAttack deployed at:", attackAddr);
  } catch (err) {
    console.error("❌ ReentrancyAttack deployment failed:", err);
    return;
  }

  try {
    console.log("⏳ Funding validator with 10 XDC...");
    await simulateProgress("💸 Sending funds");
    const tx1 = await deployer.sendTransaction({
      to: validatorAddr,
      value: parseEther("10"),
      gasLimit: 21000
    });
    await tx1.wait();
    console.log("✅ Validator funded with 10 XDC");
  } catch (err) {
    console.error("❌ Funding failed:", err);
    return;
  }

  try {
    fs.writeFileSync(
      "deployed-addresses.json",
      JSON.stringify({ validator: validatorAddr, attacker: attackAddr }, null, 2)
    );
    console.log("📁 Addresses saved to deployed-addresses.json");
  } catch (err) {
    console.error("❌ Failed to write deployed addresses file:", err);
  }
}

main().catch((error) => {
  console.error("❌ Deployment failed (main):", error);
  process.exitCode = 1;
});

