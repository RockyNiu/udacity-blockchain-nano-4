# FlightSurety

FlightSurety is a sample application project for Udacity's Blockchain course.

## Install

This repository contains Smart Contract code in Solidity (using Truffle), tests (also using Truffle), dApp scaffolding (using HTML, CSS and JS) and server app scaffolding.

Required modules:
* Truffle v5.9.0 (core: 5.8.0)
* Ganache v7.8.0
* Solidity - ^0.8.0 (solc-js)
* Node v18.14.2
* Web3.js v1.10.0

To install, download or clone the repo, then:
`git config --global url."https://github.com/".insteadOf git://github.com/`

`npm install`

`truffle compile`

## Develop Client
* Add a new file `config-prod.js` in the folder `config`; Add the following setting in `config-prod.js`

```
module.exports = {
    secret: "owner eye celery sunny pioneer pretty include girl clown topple blouse relief", #secrect of ganache instance
    firstAirlineAddress: "0x33EcD2bC8B94064Aac17e948EA3dA0D528f285A3", #second account in ganache
    firstAirlineName: "Rocky AirLine" #optional name
};
```

* To run truffle tests:

`truffle test`

or run them individually

`truffle test ./test/flightSurety.js`

`truffle test ./isOperational.js`

`truffle test ./test/oracles.js`

* To use the dapp:
Start the Ganache locally, then
`truffle migrate`

`npm run dapp`

* To view dapp:

`http://localhost:8000`

## Develop Server

`npm run server`
`truffle test ./test/oracles.js`

## Deploy

To build dapp for prod:
`npm run dapp:prod`

Deploy the contents of the ./dapp folder

## Resources

* [How does Ethereum work anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)
* [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
* [Truffle Framework](http://truffleframework.com/)
* [Ganache Local Blockchain](http://truffleframework.com/ganache/)
* [Remix Solidity IDE](https://remix.ethereum.org/)
* [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
* [Ethereum Blockchain Explorer](https://etherscan.io/)
* [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)
