pragma solidity 0.6.6;

import "./IERC20.sol";
import "./utils/WithdrawableNoModifiers.sol";
import "./utils/Utils5.sol";
import "./ISanityRateAPR.sol";
import "@nomiclabs/buidler/console.sol";
import "@chainlink/contracts/src/v0.6/ChainlinkClient.sol";

contract SanityRatesAPR is ISanityRateAPR, WithdrawableNoModifiers, Utils5 {
    // APR Reserve Contract
    // set which Token it supports (check on the SanityRate, make sure the rate it's checking for is meant for this token)

    // Be aware
    // Compiling: V6 and V4 needs to be compiled separately
    // Using truffle is going to be a problem
    // Using script is fine (/ Buidler)

    // move to sol6 folder
    // Because more features --> require, revert messages
    // additional keywords

    // assumption: if it is a token, it will either return 0 rate or revert

    IERC20 public token;
    uint256 public tokenRate;
    uint256 public reasonableDiffInBps;
    address public oracleAddress;

    constructor(address _admin, IERC20 _token)
        public
        WithdrawableNoModifiers(_admin)
    {
        token = _token;
    }

    function setReasonableDiff(uint256 diff) public {
        onlyAdmin();
        require(diff <= 100 * 100);
        reasonableDiffInBps = diff;
    }

    function setSanityRates(uint256 rate) public {
        onlyOperator();
        require(rate <= MAX_RATE);
        tokenRate = rate;
    }

    // This function is where rates are being submitted from off-chain (when manually set)

    function setOracle(address oracle) public {
        onlyOperator();
        // if Oracle is a valid ETH address and has implemented getRates() (for example), return true
        // to do: what if someone calls an invalid ETH address? what if its just a random person?

        // include an attempt to queryOracle here

        oracleAddress = oracle;
    }

    function queryOracle(IERC20 src, IERC20 dest)
        public
        view
        returns (uint256)
    {
        // to do: queryOracle function should be called when getSanityRate is called.
        // it will take src, dest tokens, and query the oracle on-chain to get the price feeds,
        // then use price feeds as an alternative to the sanity rate.

        // if (oracleAddress == 'address') return 0;

        if (src != ETH_TOKEN_ADDRESS && dest != ETH_TOKEN_ADDRESS) return 0;
        if (src == ETH_TOKEN_ADDRESS && dest != token) return 0;
        if (src == token && dest != ETH_TOKEN_ADDRESS) return 0;

        // uses oracleAddress

        // logic to interface with whatever chosen oracle -- getRate(?) should be implemented.

        // allow users to have the choice, to use many different oracle services, so it might have to be more flexible <band protocol for oracles>

        // have a flag -- if using 3rd party, query protocol, if self maintaining, query rates from storage instead

        // returns a Sanity Rate from the Oracle <oracleRate>
        return 10000;
    }

    // this is when we return the sanity rate (just for the particular token)

    function getSanityRate(IERC20 src, IERC20 dest)
        external
        override
        view
        returns (uint256)
    {
        // Some type of on-chain logic that compares sanityRate from queryOracle with sanityRate set
        // by operator. Choose whichever will prevent the trade (ie, whichever is less).

        if (src != ETH_TOKEN_ADDRESS && dest != ETH_TOKEN_ADDRESS) return 0;
        if (src == ETH_TOKEN_ADDRESS && dest != token) return 0;
        if (src == token && dest != ETH_TOKEN_ADDRESS) return 0;

        // if src is ETH, then dest must be token, otherwise if src is token, then dest must be ETH

        uint256 rate;
        uint256 oracleRate;

        if (src == ETH_TOKEN_ADDRESS && dest == token) {
            oracleRate = (PRECISION * PRECISION) / (queryOracle(src, dest));
            rate = (PRECISION * PRECISION) / tokenRate;
        } else if (src == token && dest == ETH_TOKEN_ADDRESS) {
            oracleRate = queryOracle(dest, src);
            rate = tokenRate;
        } else {
            return 0;
        }

        // if currRate differs from the sanity Rate more than 2% -- reasonable diff, use the sanityRate instead.

        // how do you want to prevent impermanent loss? make it exact? it could happen where you'll always end up using the sanityRate. compute some buffer to allow for some minor market movements.

        return (rate * (10000 + reasonableDiffInBps)) / 10000;
    }
}
