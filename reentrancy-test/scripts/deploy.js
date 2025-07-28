const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const Validator = await hre.ethers.getContractFactory("XDCValidator");
  const validator = await Validator.deploy();
  await validator.waitForDeployment();
  const validatorAddr = await validator.getAddress();
  console.log("XDCValidator deployed at:", validatorAddr);

  const Attack = await hre.ethers.getContractFactory("ReentrancyAttack");
  const attack = await Attack.deploy(validatorAddr);
  await attack.waitForDeployment();
  const attackAddr = await attack.getAddress();
  console.log("ReentrancyAttack deployed at:", attackAddr);

  // Fund validator with 10 XDC
  const tx1 = await deployer.sendTransaction({
    to: validatorAddr,
    value: hre.ethers.parseEther("10")
  });
  await tx1.wait();
  console.log("✅ Validator funded with 10 XDC");

  // Call deposit() as attacker — without sending ETH directly
  // We'll use validator.deposit() from attacker contract instead (in attack.js)

  // Save addresses to file
  fs.writeFileSync("deployed-addresses.json", JSON.stringify({
    validator: validatorAddr,
    attacker: attackAddr
  }, null, 2));
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});

