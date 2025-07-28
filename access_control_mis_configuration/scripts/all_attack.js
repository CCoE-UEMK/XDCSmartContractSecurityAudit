const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const addresses = JSON.parse(fs.readFileSync("deployed-addresses.json", "utf8"));
  const validatorAddr = addresses.validator;

  const [owner, attacker] = await hre.ethers.getSigners(); // first is deployer, second is attacker

  const validator = await hre.ethers.getContractAt("XDCValidator", validatorAddr, attacker);

  // 1. Try propose()
  console.log("🚨 Trying to call propose() from attacker account...");
  try {
    const tx = await validator.propose("0x000000000000000000000000000000000000dEaD", { value: hre.ethers.parseEther("1") });
    await tx.wait();
    console.log("❌ Unexpected success: propose() should have failed");
  } catch (e) {
    console.log("✅ Expected failure: Access control is working for propose()");
  }

  // 2. Try voteInvalidKYC()
  console.log("🚨 Trying to call voteInvalidKYC() from attacker account...");
  try {
    const tx = await validator.voteInvalidKYC("0x000000000000000000000000000000000000dEaD");
    await tx.wait();
    console.log("❌ Unexpected success: voteInvalidKYC() should have failed");
  } catch (e) {
    console.log("✅ Expected failure: Access control is working for voteInvalidKYC()");
  }

  // 3. Try resign() from attacker (who doesn’t own any candidate)
  console.log("🚨 Trying to call resign() from attacker account...");
  try {
    const tx = await validator.resign("0x000000000000000000000000000000000000dEaD");
    await tx.wait();
    console.log("❌ Unexpected success: resign() should have failed");
  } catch (e) {
    console.log("✅ Expected failure: Access control is working for resign()");
  }

  // 4. Try unvote() (attacker hasn't voted)
  console.log("🚨 Trying to call unvote() from attacker account...");
  try {
    const tx = await validator.unvote("0x000000000000000000000000000000000000dEaD", hre.ethers.parseEther("1"));
    await tx.wait();
    console.log("❌ Unexpected success: unvote() should have failed");
  } catch (e) {
    console.log("✅ Expected failure: Access control is working for unvote()");
  }
}

main().catch((error) => {
  console.error("❌ Test script failed:", error);
  process.exitCode = 1;
});

