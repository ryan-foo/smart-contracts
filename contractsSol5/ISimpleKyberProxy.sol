pragma solidity 0.5.11;

import "./IERC20.sol";


/// @title simple Kyber Network proxy interface
/// add convenient functions to help with kyber proxy API
interface ISimpleKyberProxy {
    function swapTokenToToken(
        IERC20 src,
        uint256 srcAmount,
        IERC20 dest,
        uint256 minConversionRate
    ) external returns (uint256 destAmount);

    function swapEtherToToken(IERC20 token, uint256 minConversionRate)
        external
        payable
        returns (uint256 destAmount);

    function swapTokenToEther(
        IERC20 token,
        uint256 srcAmount,
        uint256 minConversionRate
    ) external returns (uint256 destAmount);
}
