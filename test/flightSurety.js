
const Test = require('../config/testConfig.js');
const BigNumber = require('bignumber.js');
const unit = 'wei';
let accounts;
let config;
let flightSuretyData;
let flightSuretyApp;
let firstAirline;

contract('FlightSurety Contract', async (_accounts) => {
	accounts = _accounts;
});

describe('Flight Surety Tests', async () => {
	before(async () => {
		config = await Test.Config(accounts);
		flightSuretyData = config.flightSuretyData;
		flightSuretyApp = config.flightSuretyApp;
		firstAirline = config.firstAirline;
		await flightSuretyData.authorizeContract(flightSuretyApp.address);
	});

	describe('FlightSuretyData Tests', async () => {
		describe('FlightSuretyData Activate Airline', async () => {
			before(async () => {
				await flightSuretyData.registerAirline(firstAirline, 'First Airline');
			});
			
			it('register multiple arilines', async () => {
				// ARRANGE
				let newAirline = accounts[2];
				// ACT
				try {
					await flightSuretyData.registerAirline(newAirline, 'Second Airline', { from: firstAirline });
				}
				catch (e) {
					console.log(e);
				}

				let isAirlineActive = await flightSuretyData.isAirlineActive(newAirline);
				let registerAirlinesNumber = (await flightSuretyData.getRegisteredAirlineAddresses()).length;

				// ASSERT
				assert.equal(isAirlineActive, false, "Airline should not be able to activate another airline if it hasn't provided funding");
				assert.equal(registerAirlinesNumber, 2, "There should be 2 registered airlines");

				// ARRANGE
				newAirline = accounts[3];
				let value = web3.utils.toWei('9', unit);

				// ACT
				try {
					await flightSuretyData.registerAirline(newAirline, 'Third Airline', { from: firstAirline, value });
				}
				catch (e) {
					console.log(e);
				}

				isAirlineActive = await flightSuretyData.isAirlineActive(newAirline);
				registerAirlinesNumber = (await flightSuretyData.getRegisteredAirlineAddresses()).length;

				// ASSERT
				assert.equal(isAirlineActive, false, "Airline should not be able to activate another airline if it hasn't provided enough funding");
				assert.equal(registerAirlinesNumber, 3, "There should be 3 registered airlines");

				// ARRANGE
				newAirline = accounts[4];
				value = web3.utils.toWei('10', unit);

				// ACT
				try {
					await flightSuretyData.registerAirline(newAirline, 'Fouth Airline', { from: firstAirline, value });
				}
				catch (e) {
					console.log(e);
				}

				isAirlineActive = await flightSuretyData.isAirlineActive(newAirline);
				registerAirlinesNumber = (await flightSuretyData.getRegisteredAirlineAddresses()).length;

				// ASSERT
				assert.equal(isAirlineActive, true, "Airline should be able to activate another airline if it has provided enough funding");
				assert.equal(registerAirlinesNumber, 4, "There should be 4 registered airlines");

				// ARRANGE
				newAirline = accounts[5];
				value = web3.utils.toWei('10', unit);

				// ACT
				try {
					await flightSuretyData.registerAirline(newAirline, 'Fifth Airline', { from: firstAirline, value });
				}
				catch (e) {
					console.log(e);
				}
				let isAirlineRegistered = await flightSuretyData.isAirlineRegistered(newAirline);
				isAirlineActive = await flightSuretyData.isAirlineActive(newAirline);
				registerAirlinesNumber = (await flightSuretyData.getRegisteredAirlineAddresses()).length;

				// ASSERT
				assert.equal(isAirlineRegistered, false, "Airline should not be able to activate another airline immediately if there is at least 4 registered airlines");
				assert.equal(isAirlineActive, false, "Airline should not be able to be activated if it's not registered");
				assert.equal(registerAirlinesNumber, 4, "There should be 4 registered airlines");

				// ACT
				try {
					await flightSuretyData.voteAirline(newAirline, { from: accounts[2] });
				}
				catch (e) {
					console.log(e);
				}
				let voteCount = (await flightSuretyData.getAirlineInfo(newAirline)).voteCount;
				isAirlineRegistered = await flightSuretyData.isAirlineRegistered(newAirline);
				isAirlineActive = await flightSuretyData.isAirlineActive(newAirline);
				registerAirlinesNumber = (await flightSuretyData.getRegisteredAirlineAddresses()).length;

				// ASSERT
				assert.equal(voteCount, 2, "two airlines voted");
				assert.equal(isAirlineRegistered, true, "multi-party consensus of 50% among 4 registered airlines");
				assert.equal(isAirlineActive, true, "Airline should be able to be activated if it's registered and has enough funding");
				assert.equal(registerAirlinesNumber, 5, "There should be 5 registered airlines");

				// ARRANGE
				newAirline = accounts[6];
				value = web3.utils.toWei('9', unit);

				// ACT
				try {
					await flightSuretyData.registerAirline(newAirline, 'Fifth Airline', { from: firstAirline, value });
				}
				catch (e) {
					console.log(e);
				}
				isAirlineRegistered = await flightSuretyData.isAirlineRegistered(newAirline);
				isAirlineActive = await flightSuretyData.isAirlineActive(newAirline);
				registerAirlinesNumber = (await flightSuretyData.getRegisteredAirlineAddresses()).length;

				// ASSERT
				assert.equal(isAirlineRegistered, false, "Airline should not be able to activate another airline immediately if there is at least 4 registered airlines");
				assert.equal(isAirlineActive, false, "Airline should not be able to be activated if it's not registered");
				assert.equal(registerAirlinesNumber, 5, "There should be 5 registered airlines");

				// ACT
				try {
					await flightSuretyData.voteAirline(newAirline, { from: accounts[2] });
					await flightSuretyData.voteAirline(newAirline, { from: firstAirline });
				}
				catch (e) {
					console.log(e);
				}
				voteCount = (await flightSuretyData.getAirlineInfo(newAirline)).voteCount;
				isAirlineRegistered = await flightSuretyData.isAirlineRegistered(newAirline);
				isAirlineActive = await flightSuretyData.isAirlineActive(newAirline);
				registerAirlinesNumber = (await flightSuretyData.getRegisteredAirlineAddresses()).length;

				// ASSERT
				assert.equal(voteCount, 2, "two airlines voted");
				assert.equal(isAirlineRegistered, false, "multi-party consensus of 50% among 5 registered airlines");
				assert.equal(isAirlineActive, false, "Airline should not be able to be activated if it's not registered");
				assert.equal(registerAirlinesNumber, 5, "There should be 5 registered airlines");

				// ACT
				try {
					await flightSuretyData.voteAirline(newAirline, { from: accounts[3] });
				}
				catch (e) {
					console.log(e);
				}
				voteCount = (await flightSuretyData.getAirlineInfo(newAirline)).voteCount;
				isAirlineRegistered = await flightSuretyData.isAirlineRegistered(newAirline);
				isAirlineActive = await flightSuretyData.isAirlineActive(newAirline);
				registerAirlinesNumber = (await flightSuretyData.getRegisteredAirlineAddresses()).length;

				// ASSERT
				assert.equal(voteCount, 3, "three airlines voted");
				assert.equal(isAirlineRegistered, true, "multi-party consensus of 50% among 5 registered airlines");
				assert.equal(isAirlineActive, false, "Airline should not be able to be activated if it has no enoguth funding");
				assert.equal(registerAirlinesNumber, 6, "There should be 6 registered airlines");

				value = web3.utils.toWei('1', unit);
				// ACT
				try {
					await flightSuretyData.fundAirline({ from: newAirline, value });
				}
				catch (e) {
					console.log(e);
				}
				let funding = (await flightSuretyData.getAirlineInfo(newAirline)).funding;
				isAirlineRegistered = await flightSuretyData.isAirlineRegistered(newAirline);
				isAirlineActive = await flightSuretyData.isAirlineActive(newAirline);
				registerAirlinesNumber = (await flightSuretyData.getRegisteredAirlineAddresses()).length;

				// ASSERT
				assert.equal(funding, web3.utils.toWei('10', unit), `enough funding: 10 ${unit}`);
				assert.equal(isAirlineRegistered, true, "multi-party consensus of 50% among 5 registered airlines");
				assert.equal(isAirlineActive, true, "Airline should not be able to be activated if it has enoguth funding");
				assert.equal(registerAirlinesNumber, 6, "There should be 6 registered airlines");
			});
		});
	});
});
