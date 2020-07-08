pragma solidity 0.6.6;
pragma experimental ABIEncoderV2;

import {IBridge} from "./IBridge.sol";
import {ParamsDecoder, ResultDecoder} from "./Decoders.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract SimplePriceDB {
    using SafeMath for uint256;
    using ResultDecoder for bytes;
    using ParamsDecoder for bytes;
    
    IBridge public bridge;
    uint256 public price;

    constructor(
        IBridge bridge_
    ) public {
        bridge = bridge_;
    }

    function verifyAndSavePrice(bytes memory _data) public {
        (
            IBridge.RequestPacket memory latestReq,
            IBridge.ResponsePacket memory latestRes
        ) = bridge.relayAndVerify(_data);

        ParamsDecoder.Params memory params = latestReq.params.decodeParams();
        ParamsDecoder.Params uint64 oracleScriptID = latestReq.oracleScriptId;
        ResultDecoder.Result memory result = latestRes.result.decodeResult();
        ResultDecoder.Result uint64 resolveTime = latestRes.resolveTime;

        // Check for correct oracleScriptID
        require(
            oracleScriptID ==
                1,
            "ERROR_ORACLE_SCRIPT_ID_DOES_NOT_MATCH_WITH_EXPECTED"
        );
        // Check for correct request parameters
        require(
            params.symbol ==
                "BTC",
            "ERROR_SYMBOL_DOES_NOT_MATCH_WITH_EXPECTED"
        );
        require(
            params.multiplier ==
                100,
            "ERROR_MULTIPLIER_DOES_NOT_MATCH_WITH_EXPECTED"
        );
        // Check that the request resolve time is not too long ago
        require(
            resolveTime - now < 10 || now - resolveTime < 10, 
            "ERROR_MULTIPLIER_DOES_NOT_MATCH_WITH_EXPECTED"
        );
        price = uint256(result.px);
    }
}