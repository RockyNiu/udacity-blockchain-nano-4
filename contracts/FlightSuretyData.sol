// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../node_modules/@openzeppelin/contracts/utils/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    uint8 private constant AIRLINE_FREELY_REGISTRY_MAX_NUMBER = 4;
    uint256 private constant MIN_ACTIVE_FUND = 10 ether;

    address private contractOwner; // Account used to deploy contract
    mapping(address => uint8) private authorizedContracts; // Contract who could add new airline

    mapping(address => Airline) private airlines; // all airlines added
    uint256 private registeredAirLinesCount;

    bool private operational = true; // Blocks all state changes throughout the contract if false

    struct Airline {
        address airlineAddress;
        string name;
        bool isRegistered;
        bool isActive;
        uint256 fund;
        mapping(address => uint8) votes;
        uint256 voteCount;
    }

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    event AirlineIsPreRegistered(address _airlineAddress, string _name);
    event AirlineIsRegistered(address _airlineAddress, string _name);
    event FundAirline(address _airlineAddress, string _name);
    event AirlineIsActivated(address _airlineAddress, string _name);

    /**
     * @dev Constructor
     *      The deploying account becomes contractOwner
     */
    constructor() {
        contractOwner = msg.sender;
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
        _; // All modifiers require an "_" which indicates where the function body will be added
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
     * @dev Modifier that requires the registered airline account to be the function caller
     */
    modifier requireRegisteredAirline() {
        require(
            airlines[tx.origin].airlineAddress != address(0x0),
            "Airline does not exist"
        );
        require(airlines[tx.origin].isRegistered, "Airline is not registered");
        _;
    }

    /**
     * @dev Modifier that requires the function caller to be not voted yet
     */
    modifier requireNotVoted(address _airlineAddress) {
        require(
            airlines[_airlineAddress].airlineAddress != address(0x0),
            "Airline to be voted does not exist"
        );
        require(
            airlines[_airlineAddress].votes[msg.sender] != 1,
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
        address _contractAddress
    ) external requireContractOwner {
        authorizedContracts[_contractAddress] = 1;
    }

    function deauthorizeContract(
        address _contractAddress
    ) external requireContractOwner {
        delete authorizedContracts[_contractAddress];
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
        address _airlineAddress,
        string calldata _name
    )
        external
        payable
        requireIsOperational
        requireRegisteredAirline
        requireIsCallerAuthorized
    {
        Airline storage _airline = airlines[_airlineAddress];
        _airline.airlineAddress = _airlineAddress;
        _airline.name = _name;
        _airline.isRegistered = false;
        _airline.isActive = false;
        _airline.fund = msg.value;
        _airline.votes[tx.origin] = 1;
        _airline.voteCount = 1;
        emit AirlineIsPreRegistered(_airlineAddress, _name);
        if (registeredAirLinesCount <= AIRLINE_FREELY_REGISTRY_MAX_NUMBER) {
            _airline.isRegistered = true;
            registeredAirLinesCount = registeredAirLinesCount.add(1);
            emit AirlineIsRegistered(_airlineAddress, _name);
        }
    }

    /**
     * @dev Vote an airline to the registration
     *
     */
    function voteAirline(
        address _airlineAddress
    )
        external
        requireIsOperational
        requireRegisteredAirline
        requireNotVoted(_airlineAddress)
    {
        airlines[_airlineAddress].votes[tx.origin] = 1;
        airlines[_airlineAddress].voteCount = airlines[_airlineAddress]
            .voteCount
            .add(1);
        if (
            !airlines[_airlineAddress].isRegistered &&
            airlines[_airlineAddress].voteCount >= registeredAirLinesCount.div(2)
        ) {
            airlines[_airlineAddress].isRegistered = true;
            registeredAirLinesCount = registeredAirLinesCount.add(1);
            emit AirlineIsRegistered(
                _airlineAddress,
                airlines[_airlineAddress].name
            );
        }
    }

    /**
     * @dev Fund an airline
     *
     */
    function fundAirline()
        external
        payable
        requireIsOperational
        requireRegisteredAirline
    {
        airlines[tx.origin].fund = airlines[tx.origin].fund.add(msg.value);
        emit FundAirline(tx.origin, airlines[tx.origin].name);
        if (
            !airlines[tx.origin].isActive &&
            airlines[tx.origin].fund >= MIN_ACTIVE_FUND
        ) {
            airlines[tx.origin].isActive = true;
            emit AirlineIsActivated(tx.origin, airlines[tx.origin].name);
        }
    }

        /**
     * @dev Get the airline register status
     *
     * @return A bool indicates the airline if registered or not
     */
    function isRegistedAirline(address _airlineAddress) external view returns (bool) {
        return airlines[_airlineAddress].isRegistered;
    }

    /**
     * @dev Buy insurance for a flight
     *
     */
    function buy() external payable {}

    /**
     *  @dev Credits payouts to insurees
     */
    function creditInsurees() external pure {}

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
     */
    function pay() external pure {}

    /**
     * @dev Initial funding for the insurance. Unless there are too many delayed flights
     *      resulting in insurance payouts, the contract should be self-sustaining
     *
     */
    function fund() public payable {}

    function getFlightKey(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
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
