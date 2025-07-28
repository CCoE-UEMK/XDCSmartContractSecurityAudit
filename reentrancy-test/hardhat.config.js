require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
const axios = require("axios");

// List of alternative Apothem endpoints
const apothemEndpoints = [
  "https://erpc.apothem.network",
  "https://rpc.apothem.network",
  "https://apothem.rpc.xinfin.network",
  "https://apothem-xdc.blocksscan.io", // less reliable
  "https://rpc1.apothem.network",      // optional fallback
];

// Async function to select a working endpoint
function selectWorkingEndpoint() {
  for (const url of apothemEndpoints) {
    try {
      const response = require('child_process')
        .execSync(`curl -s -X POST ${url} -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'`);
      const json = JSON.parse(response.toString());
      if (json.result) return url;
    } catch (err) {
      // Continue to the next endpoint
    }
  }
  throw new Error("No working Apothem RPC endpoints found");
}

const selectedUrl = selectWorkingEndpoint();

console.log(`✅ Using Apothem endpoint: ${selectedUrl}`);

module.exports = {
  solidity: "0.8.23",
  defaultNetwork: "apothem",
  networks: {
    apothem: {
      url: selectedUrl,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};

