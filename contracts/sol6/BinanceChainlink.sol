pragma solidity 0.6.6;

import "@chainlink/contracts/src/v0.6/ChainlinkClient.sol";
import "./IOracle.sol";

/*/
LINK Token address: 0x20fE562d797A42Dcb3399062AE9546cd06f63280
Oracle address: 0xc99B3D447826532722E41bc36e644ba3479E4365
Bool JobID: f2b0f585c84a45d1993f8f3cb48ffb49
Bytes32 JobID: 1e322d70fce94991baa56e7151acddcf
Uint256 JobID: b8b8a31a3833434eba5bff70b203343d
/*/


// MyContract inherits the ChainlinkClient contract to gain the
// functionality of creating Chainlink requests
contract BinanceChainlink is ChainlinkClient, IOracle {
  // Stores the answer from the Chainlink oracle
  uint256 public currentPrice;
  address public owner;
  uint256 oraclePayment;

  constructor(uint256 _oraclePayment) public {
    // Set the address for the LINK token for the network
    setPublicChainlinkToken();
    owner = msg.sender;
  }

  function getAvgPrice(address _oracle, bytes32 _jobId, string _symbol)
  public
  onlyOwner
    {
    Chainlink.Request memory req = buildChainlinkRequest(_jobId, address(this), this.fulfillPrice.selector);
    req.add("endpoint", "avgPrice");
    req.add("symbol", _symbol);
    req.add("copyPath", "price");
    req.addInt("times", 100);
    sendChainlinkRequestTo(_oracle, req, oraclePayment);
    }

  function getRate(address _oracle, IERC20 src, IERC20 dest) external view returns (uint) {

    if (src == ETH_CONTRACT_ADDRESS) {
      getAvgPrice(, _jobId, )

    }
    else if (dest == ETH_CONTRACT_ADDRESS) {

    }

    return currentPrice;
  }

  event CurrentPrice(uint256 _price);

  function fulfillPrice(bytes32 _requestId, uint256 _price) public recordChainlinkFulfillment(_requestId)
    {
      emit CurrentPrice(_price);
    }

  // Creates a Chainlink request with the uint256 multiplier job
  function requestEthereumPrice(address _oracle, bytes32 _jobId, uint256 _payment) 
    public
    onlyOwner
  {
    // newRequest takes a JobID, a callback address, and callback function as input
    Chainlink.Request memory req = buildChainlinkRequest(_jobId, address(this), this.fulfill.selector);
    // Adds a URL with the key "get" to the request parameters
    req.add("get", "https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD");
    // Uses input param (dot-delimited string) as the "path" in the request parameters
    req.add("path", "USD");
    // Adds an integer with the key "times" to the request parameters
    req.addInt("times", 100);
    // Sends the request with the amount of payment specified to the oracle
    sendChainlinkRequestTo(_oracle, req, _payment);
  }

  // fulfill receives a uint256 data type
  function fulfill(bytes32 _requestId, uint256 _price)
    public
    // Use recordChainlinkFulfillment to ensure only the requesting oracle can fulfill
    recordChainlinkFulfillment(_requestId)
  {
    currentPrice = _price;
  }
  
  // cancelRequest allows the owner to cancel an unfulfilled request
  function cancelRequest(
    bytes32 _requestId,
    uint256 _payment,
    bytes4 _callbackFunctionId,
    uint256 _expiration
  )
    public
    onlyOwner
  {
    cancelChainlinkRequest(_requestId, _payment, _callbackFunctionId, _expiration);
  }

  
  // withdrawLink allows the owner to withdraw any extra LINK on the contract
  function withdrawLink()
    public
    onlyOwner
  {
    LinkTokenInterface link = LinkTokenInterface(chainlinkTokenAddress());
    require(link.transfer(msg.sender, link.balanceOf(address(this))), "Unable to transfer");
  }
  
  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }
}