
const Test = require('../config/testConfig.js');
const BigNumber = require('bignumber.js');
let accounts;
let config;

contract('FlightSurety Contract', async (_accounts) => {
	accounts = _accounts;
});

describe('Flight Surety Tests', async () => {
	before(async () => {
		config = await Test.Config(accounts);
		await config.flightSuretyData.authorizeContract(config.flightSuretyApp.address);
	});

	describe('FlightSuretyData Tests', async () => {
		describe('FlightSuretyData Activate Airline', async () => {
			before(async () => {
				await config.flightSuretyData.registerAirline(config.firstAirline, 'First Airline');
			});

			it('(airline) cannot activate an Airline using registerAirline() if it is not funded', async () => {
				// ARRANGE
				let newAirline = accounts[2];
				// ACT
				try {
					await config.flightSuretyData.registerAirline(newAirline, 'Second Airline', { from: config.firstAirline });
				}
				catch (e) {
					console.log(e);
				}
				let isAirlineActive = await config.flightSuretyData.isAirlineActive(newAirline);
				let registerAirlinesNumber = (await config.flightSuretyData.getRegisteredAirlineAddresses()).length;

				// ASSERT
				assert.equal(isAirlineActive, false, "Airline should not be able to activate another airline if it hasn't provided funding");
				assert.equal(registerAirlinesNumber, 2, "There should be 2 registered airlines");

				// ARRANGE
				newAirline = accounts[3];
				let value = web3.utils.toWei('9', 'ether');

				// ACT
				try {
					await config.flightSuretyData.registerAirline(newAirline, 'Third Airline', { from: config.firstAirline, value });
				}
				catch (e) {
					console.log(e);
				}
				isAirlineActive = await config.flightSuretyData.isAirlineActive(newAirline);
				registerAirlinesNumber = (await config.flightSuretyData.getRegisteredAirlineAddresses()).length;

				// ASSERT
				assert.equal(isAirlineActive, false, "Airline should not be able to activate another airline if it hasn't provided enough funding");
				assert.equal(registerAirlinesNumber, 3, "There should be 3 registered airlines");

				// ARRANGE
				newAirline = accounts[4];
				value = web3.utils.toWei('10', 'ether');

				// ACT
				try {
					await config.flightSuretyData.registerAirline(newAirline, 'Fouth Airline', { from: config.firstAirline, value });
				}
				catch (e) {
					console.log(e);
				}
				isAirlineActive = await config.flightSuretyData.isAirlineActive(newAirline);
				registerAirlinesNumber = (await config.flightSuretyData.getRegisteredAirlineAddresses()).length;

				// ASSERT
				assert.equal(isAirlineActive, true, "Airline should be able to activate another airline if it has provided enough funding");
				assert.equal(registerAirlinesNumber, 4, "There should be 4 registered airlines");

				// ARRANGE
				newAirline = accounts[5];
				value = web3.utils.toWei('10', 'wei');

				// ACT
				try {
					await config.flightSuretyData.registerAirline(newAirline, 'Fifth Airline', { from: config.firstAirline, value });
				}
				catch (e) {
					console.log(e);
				}
				let isAirlineRegistered = await config.flightSuretyData.isAirlineRegistered(newAirline);
				isAirlineActive = await config.flightSuretyData.isAirlineActive(newAirline);
				registerAirlinesNumber = (await config.flightSuretyData.getRegisteredAirlineAddresses()).length;

				// ASSERT
				assert.equal(isAirlineRegistered, false, "Airline should not be able to activate another airline immediately if there is at least 4 registered airlines");
				assert.equal(isAirlineActive, false, "Airline should not be able to be activated if it's not registered");
				assert.equal(registerAirlinesNumber, 4, "There should be 4 registered airlines");
			});
		});
	});
});
