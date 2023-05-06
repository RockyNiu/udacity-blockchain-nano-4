
const Test = require('../config/testConfig.js');
const BigNumber = require('bignumber.js');
const unit = 'gwei';
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
		await flightSuretyData.registerAirline(firstAirline, 'First Airline');
	});

	describe('FlightSuretyData Tests', async () => {
		let errorReason;
		describe('FlightSuretyData Activate Airline', async () => {
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
				assert.equal(isAirlineActive, false, 'Airline should not be able to activate another airline if it has not provided funding');
				assert.equal(registerAirlinesNumber, 2, 'There should be 2 registered airlines');

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
				assert.equal(isAirlineActive, false, 'Airline should not be able to activate another airline if it has not provided enough funding');
				assert.equal(registerAirlinesNumber, 3, 'There should be 3 registered airlines');

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
				assert.equal(isAirlineActive, true, 'Airline should be able to activate another airline if it has provided enough funding');
				assert.equal(registerAirlinesNumber, 4, 'There should be 4 registered airlines');

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
				assert.equal(isAirlineRegistered, false, 'Airline should not be able to activate another airline immediately if there is at least 4 registered airlines');
				assert.equal(isAirlineActive, false, 'Airline should not be able to be activated if it is not registered');
				assert.equal(registerAirlinesNumber, 4, 'There should be 4 registered airlines');

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
				assert.equal(voteCount, 2, 'two airlines voted');
				assert.equal(isAirlineRegistered, true, 'multi-party consensus of 50% among 4 registered airlines');
				assert.equal(isAirlineActive, true, 'Airline should be able to be activated if it is registered and has enough funding');
				assert.equal(registerAirlinesNumber, 5, 'There should be 5 registered airlines');

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
				assert.equal(isAirlineRegistered, false, 'Airline should not be able to activate another airline immediately if there is at least 4 registered airlines');
				assert.equal(isAirlineActive, false, 'Airline should not be able to be activated if it is not registered');
				assert.equal(registerAirlinesNumber, 5, 'There should be 5 registered airlines');

				// ACT
				try {
					await flightSuretyData.voteAirline(newAirline, { from: accounts[2] });
					await flightSuretyData.voteAirline(newAirline, { from: firstAirline });
				}
				catch (e) {
					errorReason = e?.data?.reason;
				}
				voteCount = (await flightSuretyData.getAirlineInfo(newAirline)).voteCount;
				isAirlineRegistered = await flightSuretyData.isAirlineRegistered(newAirline);
				isAirlineActive = await flightSuretyData.isAirlineActive(newAirline);
				registerAirlinesNumber = (await flightSuretyData.getRegisteredAirlineAddresses()).length;

				// ASSERT
				assert.equal(errorReason, 'Already voted', 'can not vote same airline');
				assert.equal(voteCount, 2, 'two airlines voted');
				assert.equal(isAirlineRegistered, false, 'multi-party consensus of 50% among 5 registered airlines');
				assert.equal(isAirlineActive, false, 'Airline should not be able to be activated if it is not registered');
				assert.equal(registerAirlinesNumber, 5, 'There should be 5 registered airlines');

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
				assert.equal(voteCount, 3, 'three airlines voted');
				assert.equal(isAirlineRegistered, true, 'multi-party consensus of 50% among 5 registered airlines');
				assert.equal(isAirlineActive, false, 'Airline should not be able to be activated if it has no enoguth funding');
				assert.equal(registerAirlinesNumber, 6, 'There should be 6 registered airlines');

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
				assert.equal(isAirlineRegistered, true, 'multi-party consensus of 50% among 5 registered airlines');
				assert.equal(isAirlineActive, true, 'Airline should not be able to be activated if it has enoguth funding');
				assert.equal(registerAirlinesNumber, 6, 'There should be 6 registered airlines');
			});
		});

		describe('FlightSuretyData Buy Insurance', async () => {
			it('register flight', async () => {
				// ARRANGE
				let flightName = 'First Flight';
				let from = 'New York';
				let to = 'Shanghai';
				let timeStamp = Math.floor(new Date('2023-01-01').getTime() / 1000);

				// ACT
				try {
					await flightSuretyData.registerFlight(firstAirline, flightName, from, to, timeStamp);
				}
				catch (e) {
					console.log(e);
				}

				let flightKeys = await flightSuretyData.getFlightKeys();
				let flightKey = flightKeys[0];
				console.log(`flightKeys: ${flightKeys}`);
				let flight = await flightSuretyData.getFlightInfo(flightKey);

				// ASSERT
				assert.equal(flight.airlineAddress, firstAirline, 'Airline Address');
				assert.equal(flight.name, flightName, 'Flight Name');
				assert.equal(flight.from, from, 'From');
				assert.equal(flight.to, to, 'To');
				assert.equal(flight.timestamp, timeStamp, 'Timestamp');
				assert.equal(flight.statusCode, '0', 'Status Code');

				
				// ARRANGE
				let passengerAddress = accounts[11];
				let premium = web3.utils.toWei('1', unit);
				let faceAmount = web3.utils.toWei('1.5', unit);

				// ACT
				try {
					await flightSuretyData.buy(firstAirline, flightName, timeStamp, passengerAddress, premium, faceAmount);
				}
				catch (e) {
					console.log(e);
				}

				let insurancePolicies = await flightSuretyData.getInsurancePolicyInfo(flightKey);
				let insurancePolicy = insurancePolicies[0];

				// ASSERT
				assert.equal(insurancePolicy.passengerAddress, passengerAddress, 'Passenger Address');
				assert.equal(insurancePolicy.premium, premium, 'Premium');
				assert.equal(insurancePolicy.faceAmount, faceAmount, 'Face Amount');
				assert.equal(insurancePolicy.isCredited, false, 'isCredited');

				// ARRANGE
				let statusCode = 20;
				// ACT
				try {
					await flightSuretyData.updateFlightStatus(firstAirline, flightName, timeStamp, statusCode);
				}
				catch (e) {
					console.log(e);
				}

				insurancePolicies = await flightSuretyData.getInsurancePolicyInfo(flightKey);
				insurancePolicy = insurancePolicies[0];
				let pendingPayment = await flightSuretyData.getPendingPayment(passengerAddress);

				// ASSERT
				assert.equal(pendingPayment.toNumber(), faceAmount, 'Pending Payment');
				assert.equal(insurancePolicy.isCredited, true, 'isCredited');

				// ARRANGE
				flightName = 'Second Flight';
				from = 'Shanghai';
				to = 'New York';
				timeStamp = Math.floor(new Date('2023-01-02').getTime() / 1000);

				// ACT
				try {
					await flightSuretyData.registerFlight(firstAirline, flightName, from, to, timeStamp);
				}
				catch (e) {
					console.log(e);
				}

				flightKeys = await flightSuretyData.getFlightKeys();
				let flightKey2 = flightKeys[1];
				flight = await flightSuretyData.getFlightInfo(flightKey2);

				// ASSERT
				assert.equal(flightKeys.length, 2, '2 flight keys');
				assert.equal(flight.airlineAddress, firstAirline, 'Airline Address');
				assert.equal(flight.name, flightName, 'Flight Name');
				assert.equal(flight.from, from, 'From');
				assert.equal(flight.to, to, 'To');
				assert.equal(flight.timestamp, timeStamp, 'Timestamp');
				assert.equal(flight.statusCode, '0', 'Status Code');

				// ARRANGE
				let premium2 = web3.utils.toWei('0.4', unit);
				let faceAmount2 = web3.utils.toWei('0.6', unit);

				// ACT
				try {
					await flightSuretyData.buy(firstAirline, flightName, timeStamp, passengerAddress, premium2, faceAmount2);
				}
				catch (e) {
					console.log(e);
				}

				insurancePolicies = await flightSuretyData.getInsurancePolicyInfo(flightKey2);
				let insurancePolicy2 = insurancePolicies[0];

				// ASSERT
				assert.equal(insurancePolicy2.passengerAddress, passengerAddress, 'Passenger Address');
				assert.equal(insurancePolicy2.premium, premium2, 'Premium');
				assert.equal(insurancePolicy2.faceAmount, faceAmount2, 'Face Amount');
				assert.equal(insurancePolicy2.isCredited, false, 'isCredited');

				// ARRANGE
				statusCode = 20;
				// ACT
				try {
					await flightSuretyData.updateFlightStatus(firstAirline, flightName, timeStamp, statusCode);
				}
				catch (e) {
					console.log(e);
				}

				insurancePolicies = await flightSuretyData.getInsurancePolicyInfo(flightKey2);
				insurancePolicy2 = insurancePolicies[0];
				pendingPayment = await flightSuretyData.getPendingPayment(passengerAddress);

				// ASSERT
				assert.equal(insurancePolicy2.isCredited, true, 'isCredited');
				assert.equal(pendingPayment.toNumber(), BigNumber.sum(faceAmount, faceAmount2).toNumber(), 'Pending Payment');


				// ACT
				try {
					await flightSuretyData.pay(passengerAddress);
				}
				catch (e) {
					console.log(e);
				}

				pendingPayment = await flightSuretyData.getPendingPayment(passengerAddress);
				// ASSERT
				assert.equal(pendingPayment.toNumber(), 0, 'Pending Payment is withdrawn');

				// ACT
				try {
					await flightSuretyData.registerFlight(firstAirline, flightName, from, to, timeStamp);
				}
				catch (e) {
					errorReason = e?.data?.reason;
				}
				// ASSERT
				assert.equal(errorReason, 'Flight has been registered!', 'cant not register the same flight second time');
			});
		});
	});
});
