const hre = require("hardhat");
const fs = require("fs");
const { ethers } = hre;

async function main() {
  const addresses = JSON.parse(fs.readFileSync("deployed-validator.json", "utf8"));
  const validatorAddr = addresses.validator;
  const validator = await ethers.getContractAt("XDCValidator", validatorAddr);

  const [proposer] = await ethers.getSigners();
  const provider = proposer.provider;

  console.log("📤 Uploading KYC...");
  try {
    const tx = await validator.uploadKYC("hash123");
    await tx.wait();
    console.log("✅ KYC uploaded");
  } catch (err) {
    console.log("⚠️ Failed to upload KYC (maybe already uploaded):", err.message);
  }

  const NUM_CANDIDATES = 500;
  const baseGasPrice = await provider.getGasPrice();

  for (let i = 1; i <= NUM_CANDIDATES; i++) {
    const suffix = i.toString(16).padStart(40, "0");
    const candidate = "0x" + suffix;

    console.log(`⏳ Proposing candidate ${candidate}`);

    try {
      const tx = await validator.propose(candidate, {
        value: ethers.utils.parseEther("1"),
        gasLimit: 1_000_000,
        gasPrice: baseGasPrice.add(ethers.BigNumber.from(i * 10_000)),
      });

      await tx.wait();
      console.log(`✅ Proposed ${candidate}`);
    } catch (err) {
      const reason = err?.error?.message || err.message;
      console.log(`❌ Failed to propose ${candidate}: ${reason}`);
      break;
    }
  }
}

main().catch((err) => {
  console.error("Script failed:", err);
});

