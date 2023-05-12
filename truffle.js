const HDWalletProvider = require("@truffle/hdwallet-provider");
const config = require('./config/config-prod.js');
const mnemonicPhrase = config.secret.trim();

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
      gasPrice: 875000000
    },
    develop: {
      port: 8545,
      network_id: 20,
      accounts: 50,
      defaultEtherBalance: 500,
    }
  },
  compilers: {
    solc: {
      version: "^0.8.0"
    }
  },
  mocha: {
    timeout: 20000
  },
  solidityLog: {
    displayPrefix: '************', // defaults to ""
    preventConsoleLogMigration: true, // defaults to false
  }
};