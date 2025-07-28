require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.4.21", // Or whichever version your .sol contract uses
      },
    ],
  },
  networks: {
    apothem: {
      url: "https://erpc.apothem.network",
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};

