# XDCSmartContractSecurityAudit
# 🔐 XDC Smart Contract Security Audit

This project investigates and demonstrates multiple vulnerabilities in the `XDCValidator.sol` smart contract used in the XDC Network. The audit involved both static analysis and hands-on attack simulations using custom Hardhat-based projects.

---

## 🧪 Overview of Vulnerabilities

| Vulnerability Name                  | Detected by Tool | Confirmed by Manual Testing | Status |
|------------------------------------|------------------|------------------------------|--------|
| Reentrancy Attack                  | ✅ Yes           | ✅ Yes                       | Exploitable |
| Access Control Misconfiguration    | ✅ Yes           | ❌ No                        | Not Exploitable |
| Governance Gas Vulnerabilities     | ✅ Yes           | ✅ Yes                       | Exploitable |
| Delete on Mappings  Dynamic Arrays (`candidateResign`) | ✅ Yes                      | Exploitable |

---

## 📁 Project Structure

XDC-SmartContractSecurityAudit/
├── access_control_mis_configuration/
│ ├── contracts/
│ ├── scripts/
│ ├── hardhat.config.js
│ └── package.json
│
├── candidare_resign/
│ ├── contracts/
│ ├── scripts/
│ ├── hardhat.config.js
│ └── package.json
│
├── governance_gas_vulnerabilities/
│ ├── contracts/
│ ├── scripts/
│ ├── hardhat.config.js
│ └── package.json
│
├── reentrancy-test/
│ ├── contracts/
│ ├── scripts/
│ ├── hardhat.config.js
│ └── package.json
│
├── migrationV2/
│ ├── contracts/ → Secure version XDCValidatorV2.sol
│ ├── scripts/ → Deployment + attack validation
│ ├── hardhat.config.js
│ └── package.json

---

## ⚙️ Setup & Usage

Each folder is **independent** and contains its own:

- `hardhat.config.js`
- `package.json`
- Dependencies

You must install dependencies **separately** in each folder.

### 🔧 Installation

Navigate to a vulnerability folder and install dependencies:

```bash
cd <folder_name>
npm install
Repeat the above for each of the following folders (as needed):

access_control_mis_configuration

candidare_resign

governance_gas_vulnerabilities

reentrancy-test

migrationV2

### 🔐 Environment Setup

Each project uses a `.env` file to securely store sensitive values like your private key.

#### ✅ Create a `.env` file in each folder (next to `hardhat.config.js`):

```bash
touch .env
✅ Add the following content:

PRIVATE_KEY=your_private_key_here_without_0x
⚠️ Important: Do NOT include the 0x prefix in the private key.


🚀 Deploy Vulnerable Contracts
npx hardhat run scripts/deploy.js --network <network>
💥 Run Attack Scripts
Each folder includes scripts to simulate the attack scenario:

npx hardhat run scripts/<attack_script>.js --network <network>
For the fixed version under migrationV2:

# Deploy fixed contract
npx hardhat run scripts/deploy_<vuln_type>.js --network <network>

# Attempt to attack (should fail)
npx hardhat run scripts/attack_<vuln_type>.js --network <network>

🛡️ Secure Contract
migrationV2/contracts/XDCValidatorV2.sol is the proposed secure contract, which addresses the confirmed vulnerabilities. The folder also includes scripts to validate that the vulnerabilities no longer exist after mitigation.

✅ Conclusion
Static tools are helpful for detection, but manual validation is critical.

Confirmed vulnerabilities were responsibly tested and mitigated.

Suggested contract improvements focus on reentrancy prevention, gas optimization, and safe state management.

📃 License
This repository is intended for educational and research purposes only. Use responsibly.

🙌 Acknowledgments
Thanks to the XDC developer documentation and the open-source tools used in smart contract auditing.

