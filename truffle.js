const HDWalletProvider = require("@truffle/hdwallet-provider");
const fs = require('fs');
const mnemonicPhrase = fs.readFileSync(".secret").toString().trim();

module.exports = {
  networks: {
    development: {
      provider: () =>
        new HDWalletProvider({
          mnemonic: {
            phrase: mnemonicPhrase
          },
          providerOrUrl: "http://127.0.0.1:8545/",
          numberOfAddresses: 100
        }),
      network_id: '*',
      gas: 5000000,
      gasPrice: 765625000
    }
  },
  compilers: {
    solc: {
      version: "^0.8.0"
    }
  }
};