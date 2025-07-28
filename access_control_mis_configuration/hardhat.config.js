require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.4.21",
      },
    ],
  },
  networks: {
    apothem: {
      url: "https://rpc.apothem.network",
     accounts: [
      process.env.PRIVATE_KEY
    },
  },
};


