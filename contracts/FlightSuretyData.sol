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
    bool private operational = true; // Blocks all state changes throughout the contract if false
    mapping(address => Airline) private airlines;
    uint256 private registedAirLinesCount = 0;

    struct Airline {
        address airlineAddress;
        string name;
        bool isRegisted;
        bool isActive;
        uint256 fund;
        mapping(address => uint8) votes;
        uint256 voteCount;
    }

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    event AirlineIsPreRegisted(address _airlineAddress, string _name);
    event AirlineIsRegisted(address _airlineAddress, string _name);
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

    /**
     * @dev Modifier that requires the registed airline account to be the function caller
     */
    modifier requireRegistedAirline() {
        require(
            airlines[msg.sender].airlineAddress != address(0x0),
            "Airline does not exist"
        );
        require(airlines[msg.sender].isRegisted, "Airline is not registed");
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
    ) external requireIsOperational requireRegistedAirline {
        Airline storage _airline = airlines[_airlineAddress];
        _airline.airlineAddress = _airlineAddress;
        _airline.name = _name;
        _airline.isRegisted = false;
        _airline.isActive = false;
        _airline.fund = 0;
        _airline.votes[msg.sender] = 1;
        _airline.voteCount = 1;
        emit AirlineIsPreRegisted(_airlineAddress, _name);
        if (registedAirLinesCount <= AIRLINE_FREELY_REGISTRY_MAX_NUMBER) {
            _airline.isRegisted = true;
            registedAirLinesCount = registedAirLinesCount.add(1);
            emit AirlineIsRegisted(_airlineAddress, _name);
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
        requireRegistedAirline
        requireNotVoted(_airlineAddress)
    {
        airlines[_airlineAddress].votes[msg.sender] = 1;
        airlines[_airlineAddress].voteCount = airlines[_airlineAddress]
            .voteCount
            .add(1);
        if (
            !airlines[_airlineAddress].isRegisted &&
            airlines[_airlineAddress].voteCount >= registedAirLinesCount.div(2)
        ) {
            airlines[_airlineAddress].isRegisted = true;
            registedAirLinesCount = registedAirLinesCount.add(1);
            emit AirlineIsRegisted(_airlineAddress, airlines[_airlineAddress].name);
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
        requireRegistedAirline
    {
        airlines[msg.sender].fund = airlines[msg.sender].fund.add(msg.value);
        emit FundAirline(msg.sender, airlines[msg.sender].name);
        if (!airlines[msg.sender].isActive && airlines[msg.sender].fund >= MIN_ACTIVE_FUND) {
            airlines[msg.sender].isActive = true;
            emit AirlineIsActivated(msg.sender, airlines[msg.sender].name);
        }
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
    receive() external payable {
    }
}
