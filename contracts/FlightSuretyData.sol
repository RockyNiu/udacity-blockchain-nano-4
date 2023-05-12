// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "truffle/console.sol";
import "../node_modules/@openzeppelin/contracts/utils/math/SafeMath.sol";


contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    uint8 private constant AIRLINE_FREELY_REGISTRY_MAX_NUMBER = 4;
    uint256 private constant MIN_ACTIVE_FUND = 10 ether;

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    address private contractOwner; // Account used to deploy contract
    mapping(address => uint8) private authorizedContracts; // Contract who could add new airline

    mapping(address => Airline) private airlines; // all airlines added
    address[] private pendingAirlineAddresses;
    address[] private registeredAirlineAddresses;

    bool private operational = true; // Blocks all state changes throughout the contract if false

    mapping(bytes32 => Flight) private flights;
    bytes32[] private flightKeys;
    mapping(bytes32 => InsurancePolicy[]) private insurancePolicies; // insurance policies per flight
    mapping(address => uint256) private pendingPayments;

    struct Airline {
        address airlineAddress;
        string name;
        bool isRegistered;
        bool isActive;
        uint256 funding;
        mapping(address => uint8) votes;
        uint256 voteCount;
    }

    struct Flight {
        address airlineAddress;
        string name;
        string from;
        string to;
        uint256 timestamp;
        uint8 statusCode;
    }

    struct InsurancePolicy {
        address passengerAddress;
        uint256 premium;
        uint256 faceAmount;
        bool isCredited;
    }
    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    event AirlineIsPreRegistered(address airlineAddress, string name);
    event AirlineIsRegistered(address airlineAddress, string name);
    event FundAirline(address airlineAddress, string name, uint256 funding);
    event AirlineIsActivated(address airlineAddress, string name);
    event FlightIsRegistered(
        bytes32 flightKey,
        address airlineAddress,
        string flightName,
        string from,
        string to,
        uint256 timestamp
    );
    event FlightStatusIsUpdated(
        address airlineAddress,
        string flightName,
        uint256 timestamp,
        uint8 statusCode
    );
    event InsuranceIsBought(
        address airlineAddress,
        string flightName,
        uint256 timestamp,
        address passengerAddress,
        uint256 premium,
        uint256 faceAmount
    );
    event InsureeIsCredited(address insureeAddress, uint256 faceAmount);
    event Withdrawn(address passengerAddress, uint256 payment);

    /**
     * @dev Constructor
     *      The deploying account becomes contractOwner
     */
    constructor(address firstAirlineAddress, string memory firstAirlineName) {
        contractOwner = msg.sender;
        authorizedContracts[msg.sender] = 1;
        airlines[firstAirlineAddress].airlineAddress = firstAirlineAddress;
        airlines[firstAirlineAddress].name = firstAirlineName;
        airlines[firstAirlineAddress].isRegistered = true;
        airlines[firstAirlineAddress].isActive = false;
        airlines[firstAirlineAddress].votes[msg.sender] = 1;
        airlines[firstAirlineAddress].voteCount = 1;

        registeredAirlineAddresses.push(firstAirlineAddress);
        emit AirlineIsRegistered(firstAirlineAddress, firstAirlineName);
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
     * @dev Modifier that requires the "operational" boolean variable to be "true"
     *      This is used on all state changing functions to pause the contract in
     *      the event there is an issue that needs to be fixed
     */
    modifier requireIsOperational() {
        require(operational, "Contract is currently not operational");
        _; // All modifiers require an "" which indicates where the function body will be added
    }

    /**
     * @dev Modifier that requires the "ContractOwner" account to be the function caller
     */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireIsCallerAuthorized() {
        require(
            authorizedContracts[msg.sender] == 1,
            "Caller is not authorized"
        );
        _;
    }

    /**
     * @dev Modifier that requires the function caller to be not voted yet
     */
    modifier requireNotVoted(address voterAddress, address airlineAddress) {
        require(
            airlines[airlineAddress].airlineAddress != address(0x0),
            "Airline to be voted does not exist"
        );
        require(
            airlines[airlineAddress].votes[voterAddress] != 1,
            "Already voted"
        );
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Get operating status of contract
     *
     * @return A bool that is the current operating status
     */
    function isOperational() external view returns (bool) {
        return operational;
    }

    /**
     * @dev Sets contract operations on/off
     *
     * When operational mode is disabled, all write transactions except for this one will fail
     */
    function setOperatingStatus(bool mode) external requireContractOwner {
        operational = mode;
    }

    function authorizeContract(
        address contractAddress
    ) external requireContractOwner {
        authorizedContracts[contractAddress] = 1;
    }

    function deauthorizeContract(
        address contractAddress
    ) external requireContractOwner {
        delete authorizedContracts[contractAddress];
    }

    function getRegisteredAirlineAddresses()
        external
        view
        returns (address[] memory)
    {
        return registeredAirlineAddresses;
    }

    function getPendingAirlineAddresses()
        external
        view
        returns (address[] memory)
    {
        return pendingAirlineAddresses;
    }

    function getFlighKeys() external view returns (bytes32[] memory) {
        return flightKeys;
    }

    function getPendingPayment(
        address passengerAddress
    ) external view returns (uint256) {
        return pendingPayments[passengerAddress];
    }

    function getAirlineInfo(
        address airlineAddress
    )
        external
        view
        returns (
            string memory name,
            bool isRegistered,
            bool isActive,
            uint256 funding,
            uint256 voteCount
        )
    {
        name = airlines[airlineAddress].name;
        isRegistered = airlines[airlineAddress].isRegistered;
        isActive = airlines[airlineAddress].isActive;
        funding = airlines[airlineAddress].funding;
        voteCount = airlines[airlineAddress].voteCount;
    }

    function getFlightKeys()
        external
        view
        returns (bytes32[] memory _flightKeys)
    {
        _flightKeys = flightKeys;
    }

    function getFlightInfo(
        bytes32 flightKey
    ) external view returns (Flight memory flight) {
        flight = flights[flightKey];
    }

    function getInsurancePolicyInfo(
        bytes32 flightKey
    ) external view returns (InsurancePolicy[] memory policies) {
        policies = insurancePolicies[flightKey];
    }

    function removePendingAirlineAddress(address airlineAddress) internal {
        uint256 index = indexOfAddressArray(
            pendingAirlineAddresses,
            airlineAddress
        );
        require(
            index < pendingAirlineAddresses.length,
            "Index is out of bound"
        );
        pendingAirlineAddresses[index] = pendingAirlineAddresses[
            pendingAirlineAddresses.length.sub(1)
        ];
        pendingAirlineAddresses.pop();
    }

    function indexOfAddressArray(
        address[] storage addresses,
        address targetAddress
    ) internal view returns (uint256) {
        for (uint256 i = 0; i < addresses.length; i = i.add(1)) {
            if (addresses[i] == targetAddress) {
                return i;
            }
        }
        revert("Index was not found");
    }

    function checkFunding(
        address airlineAddress
    ) internal requireIsOperational {
        if (
            !airlines[airlineAddress].isActive &&
            airlines[airlineAddress].funding >= MIN_ACTIVE_FUND
        ) {
            airlines[airlineAddress].isActive = true;
            emit AirlineIsActivated(
                airlineAddress,
                airlines[airlineAddress].name
            );
        }
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /**
     * @dev Add an airline to the registration queue
     *      Can only be called from FlightSuretyApp contract
     *
     */
    function registerAirline(
        address registerAddress,
        address airlineAddress,
        string calldata name
    )
        external
        payable
        requireIsOperational
        requireIsCallerAuthorized
    {
        airlines[airlineAddress].airlineAddress = airlineAddress;
        airlines[airlineAddress].name = name;
        airlines[airlineAddress].isRegistered = false;
        airlines[airlineAddress].isActive = false;
        airlines[airlineAddress].funding = msg.value;
        airlines[airlineAddress].votes[registerAddress] = 1;
        airlines[airlineAddress].voteCount = 1;
        emit AirlineIsPreRegistered(airlineAddress, name);
        if (
            registeredAirlineAddresses.length <
            AIRLINE_FREELY_REGISTRY_MAX_NUMBER
        ) {
            airlines[airlineAddress].isRegistered = true;
            registeredAirlineAddresses.push(airlineAddress);
            emit AirlineIsRegistered(airlineAddress, name);
            checkFunding(airlineAddress);
        } else {
            pendingAirlineAddresses.push(airlineAddress);
        }
    }

    /**
     * @dev Vote an airline to the registration
     *
     */
    function voteAirline(
        address voterAddress,
        address airlineAddress
    )
        external
        requireIsOperational
        requireNotVoted(voterAddress, airlineAddress)
        requireIsCallerAuthorized
        returns (uint256 voteCount)
    {
        airlines[airlineAddress].votes[voterAddress] = 1;
        voteCount = airlines[airlineAddress].voteCount.add(1);
        airlines[airlineAddress].voteCount = voteCount;
        if (
            !airlines[airlineAddress].isRegistered &&
            airlines[airlineAddress].voteCount >=
            registeredAirlineAddresses.length.add(1).div(2)
        ) {
            airlines[airlineAddress].isRegistered = true;
            registeredAirlineAddresses.push(airlineAddress);
            removePendingAirlineAddress(airlineAddress);
            emit AirlineIsRegistered(
                airlineAddress,
                airlines[airlineAddress].name
            );
            checkFunding(airlineAddress);
        }
    }

    /**
     * @dev Fund an airline
     *
     */
    function fundAirline(address funderAddress)
        external
        payable
        requireIsOperational
        requireIsCallerAuthorized
    {
        airlines[funderAddress].funding = airlines[funderAddress].funding.add(
            msg.value
        );
        emit FundAirline(funderAddress, airlines[funderAddress].name, msg.value);
        checkFunding(funderAddress);
    }

    /**
     * @dev Get the airline register status
     *
     * @return A bool indicates the airline if registered or not
     */
    function isAirlineRegistered(
        address airlineAddress
    ) external view returns (bool) {
        return airlines[airlineAddress].isRegistered;
    }

    /**
     * @dev Get the airline register status
     *
     * @return A bool indicates the airline if registered or not
     */
    function isAirlineNotRegistered(
        address airlineAddress
    ) external view returns (bool) {
        return airlines[airlineAddress].airlineAddress != address(0x0) && airlines[airlineAddress].isRegistered == false;
    }

    /**
     * @dev Get the airline active status
     *
     * @return A bool indicates the airline if active or not
     */
    function isAirlineActive(
        address airlineAddress
    ) external view returns (bool) {
        return airlines[airlineAddress].isActive;
    }

    /**
     * @dev Register a flight
     */
    function registerFlight(
        address airlineAddress,
        string calldata name,
        string calldata from,
        string calldata to,
        uint256 timestamp
    ) external requireIsOperational requireIsCallerAuthorized {
        bytes32 flightKey = getFlightKey(airlineAddress, name, timestamp);
        require(
            flights[flightKey].airlineAddress == address(0x0),
            "Flight has been registered!"
        );
        flights[flightKey] = Flight({
            airlineAddress: airlineAddress,
            name: name,
            from: from,
            to: to,
            timestamp: timestamp,
            statusCode: STATUS_CODE_UNKNOWN
        });
        flightKeys.push(flightKey);
        emit FlightIsRegistered(
            flightKey,
            airlineAddress,
            name,
            from,
            to,
            timestamp
        );
    }

    /**
     * @dev Register a flight
     */
    function updateFlightStatus(
        address airlineAddress,
        string calldata flightName,
        uint256 timestamp,
        uint8 statusCode
    ) external requireIsOperational requireIsCallerAuthorized {
        bytes32 flightKey = getFlightKey(airlineAddress, flightName, timestamp);
        flights[flightKey].statusCode = statusCode;
        emit FlightStatusIsUpdated(
            airlineAddress,
            flightName,
            timestamp,
            statusCode
        );
        if (statusCode == STATUS_CODE_LATE_AIRLINE) {
            creditInsurees(airlineAddress, flightName, timestamp);
        }
    }

    /**
     * @dev Buy insurance for a flight. TODO check maximum amount of premium should be smaller than 1 ether
     *
     */
    function buy(
        address airlineAddress,
        string calldata flightName,
        uint256 timestamp,
        address passengerAddress,
        uint256 premium,
        uint256 faceAmount
    ) external payable requireIsOperational requireIsCallerAuthorized {
        bytes32 flightKey = getFlightKey(airlineAddress, flightName, timestamp);
        insurancePolicies[flightKey].push(
            InsurancePolicy({
                passengerAddress: passengerAddress,
                premium: premium,
                faceAmount: faceAmount,
                isCredited: false
            })
        );
        emit InsuranceIsBought(
            airlineAddress,
            flightName,
            timestamp,
            passengerAddress,
            premium,
            faceAmount
        );
    }

    /**
     *  @dev Credits payouts to insurees. TODO check whether there is enough fund for transfer to all
     */
    function creditInsurees(
        address airlineAddress,
        string calldata flightName,
        uint256 timestamp
    ) internal requireIsOperational requireIsCallerAuthorized {
        bytes32 flightKey = getFlightKey(airlineAddress, flightName, timestamp);
        for (uint i = 0; i < insurancePolicies[flightKey].length; i++) {
            InsurancePolicy memory policy = insurancePolicies[flightKey][i];
            if (!policy.isCredited) {
                insurancePolicies[flightKey][i].isCredited = true;
                pendingPayments[policy.passengerAddress] = pendingPayments[policy.passengerAddress].add(policy.faceAmount);
                emit InsureeIsCredited(
                    policy.passengerAddress,
                    policy.faceAmount
                );
            }
        }
    }

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
     */
    function pay(
        address passengerAddress
    ) external requireIsOperational requireIsCallerAuthorized {
        require(
            pendingPayments[passengerAddress] > 0,
            "No fund awailable for withdrawal"
        );

        uint256 payment = pendingPayments[passengerAddress];
        pendingPayments[passengerAddress] = 0;

        payable(passengerAddress).transfer(payment);
        emit Withdrawn(passengerAddress, payment);
    }

    /**
     * @dev Initial funding for the insurance. Unless there are too many delayed flights
     *      resulting in insurance payouts, the contract should be self-sustaining
     *
     */
    function fund() public payable {}

    function getFlightKey(
        address airlineAddress,
        string calldata name,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airlineAddress, name, timestamp));
    }

    /**
     * @dev Fallback function for funding smart contract.
     *
     */
    fallback() external payable {
        fund();
    }

    /**
     * @dev Receive function
     *
     */
    receive() external payable {}
}
