pragma solidity 0.4.18;


import "./ERC20Interface.sol";
import "./Withdrawable.sol";
import "./Utils.sol";
import "./SanityRatesInterface.sol";

contract SanityRatesAPR is SanityRatesInterface, Withdrawable, Utils {

    // doesn't have to pass in an array, only one ERC token, stores it in the storage
    // so just a uint, not a mapping

    // APR Reserve Contract
    // set which Token it supports (check on the SanityRate, make sure the rate it's checking for is meant for this token)
    
    ERC20 public token;
    uint public tokenRate;
    uint public reasonableDiffInBps;

    function SanityRatesAPR(address _admin) public {
        require(_admin != address(0));
        admin = _admin;
    }

    function setReasonableDiff(uint diff) public onlyAdmin {
            require(diff <= 100 * 100);
            reasonableDiffInBps = diff;
        }

    function setSanityRates(uint rate) public onlyOperator {
            require(rate <= MAX_RATE);
            tokenRate = rate;
        }
        // This function is where rates are being submitted from off-chain (when manually set)

    function setOracle(address oracle) public view onlyOperator returns(bool) {
        // if Oracle is a valid ETH address and has implemented getRates() (for example), return true
        // to do : what if someone calls an invalid ETH address? what if its just a random person?


        return false;
    }

    function queryOracle(ERC20 src, ERC20 dest) internal pure returns(uint) {

        // to do: queryOracle function should be called when getSanityRate is called.
        // it will take src, dest tokens, and query the oracle on-chain to get the price feeds,
        // then use price feeds as an alternative to the sanity rate.
        uint rate;

        if (src != ETH_TOKEN_ADDRESS && dest != ETH_TOKEN_ADDRESS) return 0;
        

        // logic to interface with whatever chosen oracle -- getRate(?) should be implemented.

        // allow users to have the choice, to use many different oracle services, so it might have to be more flexible <band protocol for oracles>

        // have a flag -- if using 3rd party, query protocol, if self maintaining, query rates from storage instead

        // returns a Sanity Rate from the Oracle <oracleRate>
        return 0;
    }

    // this is when we return the sanity rate (just for the particular token)

    function getSanityRate(ERC20 src, ERC20 dest) public view returns(uint) {

        // Some type of on-chain logic that compares sanityRate from queryOracle with sanityRate set
        // by operator. Choose whichever will prevent the trade (ie, whichever is less).

        if (src != ETH_TOKEN_ADDRESS && dest != ETH_TOKEN_ADDRESS) return 0;
        // if src is ETH, then dest must be token, otherwise if src is token, then dest must be ETH

        // check if the rate its asking for is the same token?

        uint rate;
        uint oracleRate;

        // refactor: let them have the choice of having 3rd party oracle or local storage rates

        if (src == ETH_TOKEN_ADDRESS) {
            oracleRate = queryOracle(src, dest); // check again if src/dest is correct
            rate = (PRECISION*PRECISION)/tokenRate;
            token = dest;
        } else {
            oracleRate = queryOracle(dest, src);
            rate = tokenRate;
            token = src;
        }

        // if currRate differs from the sanity Rate more than 2% -- reasonable diff, use the sanityRate instead.

        // how do you want to prevent impermanent loss? make it exact? it could happen where you'll always end up using the sanityRate. compute some buffer to allow for some minor market movements.

        return rate * (10000 + reasonableDiffInBps)/10000;
    }
}
