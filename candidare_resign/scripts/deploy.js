const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  const candidates = [
    "0x1111111111111111111111111111111111111111",
    "0x2222222222222222222222222222222222222222",
    "0x3333333333333333333333333333333333333333"
  ];

  const caps = [
    ethers.parseEther("2"),
    ethers.parseEther("2"),
    ethers.parseEther("2")
  ];

  const XDCValidator = await ethers.getContractFactory("XDCValidator");

  const validator = await XDCValidator.deploy(
    candidates,
    caps,
    deployer.address,
    ethers.parseEther("1"),
    ethers.parseEther("0.5"),
    100,
    5,
    5
  );

  await validator.waitForDeployment();

  console.log("✅ XDCValidator deployed at:", validator.target);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});

