
const Test = require('../config/testConfig.js');
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
		describe('FlightSuretyData Operations and Settings Tests', async () => {
			it(`(multiparty) has correct initial isOperational() value`, async function () {
				// Get operating status
				const status = await config.flightSuretyData.isOperational();
				assert.equal(status, true, "Incorrect initial operating status value");
			});

			it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {
				// Ensure that access is denied for non-Contract Owner account
				let accessDenied = false;
				try {
					await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[0] });
				}
				catch (e) {
					accessDenied = true;
				}
				assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
			});

			it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {
				// Ensure that access is allowed for Contract Owner account
				let accessDenied = false;
				try {
					await config.flightSuretyData.setOperatingStatus(false);
				}
				catch (e) {
					accessDenied = true;
				}
				assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
			});

			it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

				await config.flightSuretyData.setOperatingStatus(false);

				let reverted = false;
				try {
					await config.flightSuretyData.registerAirline(accounts[1], 'First Airline', {from: config.firstAirline});
				}
				catch (e) {
					reverted = true;
				}
				assert.equal(reverted, true, "Access not blocked for requireIsOperational");

				// Set it back for other tests to work
				await config.flightSuretyData.setOperatingStatus(true);
			});
		});
	});
});
