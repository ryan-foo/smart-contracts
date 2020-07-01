pragma solidity 0.6.6;
import "./IERC20.sol";

/// @title Sanity Rate for the APR

interface ISanityRateAPR {
    function getSanityRate(IERC20 src, IERC20 dest) external payable returns (uint);
}
