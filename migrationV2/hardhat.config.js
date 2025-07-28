require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.23", // match your contract version
      },
    ],
  },
  networks: {
    apothem: {
      url: "https://rpc.apothem.network",
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};


