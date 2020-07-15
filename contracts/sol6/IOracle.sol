pragma solidity 0.6.6;

import "./IERC20.sol";

interface IOracle {
    function getRate(
        IERC20 src,
        IERC20 dest
    ) external view returns (uint);
}