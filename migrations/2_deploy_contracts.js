const config = require('../config/config-prod.js');
const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const fs = require('fs');

module.exports = function (deployer) {
    deployer.deploy(FlightSuretyData).then(async (flightSuretyData) => {
        await flightSuretyData.registerAirline(config.firstAirlineAddress, config.firstAirlineName);
        const flightSuretyApp = await deployer.deploy(FlightSuretyApp, flightSuretyData.address);
        await flightSuretyData.authorizeContract(flightSuretyApp.address);
        const configContent = {
            localhost: {
                url: 'http://localhost:8545',
                dataAddress: flightSuretyData.address,
                appAddress: flightSuretyApp.address
            }
        };
        fs.writeFileSync(__dirname + '/../src/dapp/config.json', JSON.stringify(configContent, null, '\t'), 'utf-8');
        fs.writeFileSync(__dirname + '/../src/server/config.json', JSON.stringify(configContent, null, '\t'), 'utf-8');
    });

}