import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';


const config = Config['localhost'];
const web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
const flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

const TEST_ORACLES_COUNT = 20; // total number of test oracles
const ORACLES_ACCOUNT_OFFSET = 21; //the first index of oracle accounts in ganache instance
const STATUS_CODE_UNKNOWN = 0;
const STATUS_CODE_ON_TIME = 10;
const STATUS_CODE_LATE_AIRLINE = 20;
const STATUS_CODE_LATE_WEATHER = 30;
const STATUS_CODE_LATE_TECHNICAL = 40;
const STATUS_CODE_LATE_OTHER = 50;
const STATUS_CODES = [
  STATUS_CODE_UNKNOWN,
  STATUS_CODE_ON_TIME,
  STATUS_CODE_LATE_AIRLINE,
  STATUS_CODE_LATE_WEATHER,
  STATUS_CODE_LATE_TECHNICAL,
  STATUS_CODE_LATE_OTHER,
];
const oracles = [];

function randomValue(arr) {
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

web3.eth.getAccounts(async (error, accounts) => {
  if (error) {
    console.log(error);
  }
  else {
    const fee = await flightSuretyApp.methods.REGISTRATION_FEE().call();
    for (let a = ORACLES_ACCOUNT_OFFSET; a < TEST_ORACLES_COUNT; a++) {
      const address = accounts[a];
      await flightSuretyApp.methods.registerOracle().call({ from: address, value: fee });
      const index = await flightSuretyApp.methods.getMyIndexes().call({ from: address });
      const oracle = { address, index };
      oracles.push(oracle);
      console.log(`Oracle Registered: ${JSON.stringify(oracle)}`);
    }
  }
});


flightSuretyApp.events.OracleRequest({
  fromBlock: 0
}, async (error, event) => {
  if (error) {
    console.log(error);
  }
  else {
    console.log(event);
    const {index, airline, flight, timestamp} = event.returnValues;
    const statusCode = randomValue(STATUS_CODES);
    for (let a = 0; a < oracles.length; a++) {
      const oracle = oracles[a];
      if (a.index.includes(index)) {
        try {
          await flightSuretyApp.methods.submitOracleResponse(index, airline, flight, timestamp, statusCode, { from: oracle.address });
        }
        catch (error) {
          console.log(error);
        }
        console.log(`${JSON.stringify(oracle)}: Submit Status Code ${statusCode}`);
      }
    }
  }
});

const app = express();
app.get('/api', (req, res) => {
  res.send({
    message: 'An API for use with your Dapp!'
  });
});

export default app;


