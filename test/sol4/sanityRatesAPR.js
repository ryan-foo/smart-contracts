
let SanityRatesAPR = artifacts.require("./SanityRatesAPR.sol")

const { zeroAddress } = require("../helper.js");
let Helper = require("../helper.js");
const BN = web3.utils.BN;

const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');


//global variables
const ethAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const kncAddress = '0xdd974D5C2e2928deA5F71b9825b8b646686BD200';
// We test with KNC
const precisionUnits = (new BN(10).pow(new BN(18)));
const bps = new BN(10000);

let sanityRatesAPR;
let admin;
let operator;
let token;
let rate;
let reasonableDiff;

// separate tests in terms of functionality

// describe getSanityRate in many different situations

// describe reserve manager did not set the sanityRate

// describe where the sanityRate where the price difference, the rate returned by the reserve is very small, which rate should be used? what do you expect?

// the diff between sanity rate and reserve rate? which one do you expect to use?

// look at very worst case scenarios, what if reserve manager is malicious?

// how would you protect reserve against that? <extreme cases>

contract('SanityRatesAPR', function(accounts) {

    before("one time global init", async() => {
        //init accounts
        admin = accounts[0];
        token = kncAddress;
        operator = accounts[2];
        user = accounts[3];
        storage = accounts[4];
        // SanityRatesAPR only supports one token, so I only set the rates for one token

        rate = new BN(1).mul(precisionUnits.div(new BN(10)));
        reasonableDiff = new BN(100);

        sanityRatesAPR = await SanityRatesAPR.new(admin);
        await sanityRatesAPR.addOperator(operator);
        // await sanityRatesAPR.setSanityRates(token, reasonableDiff);

    });

    describe("Functionality of setReasonableDiff", async() => {
        it("should change reasonableDiff from the default reasonableDiff", async() => {

        });

        it("should throw a TypeError when we set reasonableDiff to a string", async() => {

        });

        it("should complain when we set reasonableDiff to be negative", async() => {

        });

    });

    describe("Functionality of setSanityRates", async() => {

        it("should set the Sanity Rates to the new rate", async () => {

        });

        it("should throw an error when presented with a negative sanity rate", async () => {

        });

        it("should not accept characters as a sanity rate", async () => {

        });

    });

    // 



    // setOracle

    describe("Functionality of setOracle", async () => {

        it("should change the current oracle when you call setOracle with a valid address", async () => {
            let oracleAddress = await sanityRatesAPR.setOracle(address, {from: operator});
            // to do
            let expectedOracleAddress = address;
            return Helper.assertEqual(oracleAddress, expectedOracle);
        });
    
        it("should warn you when you set an invalid oracle address", async () => {
            // Accomplished by attempting to call the method specified by the oracle interface
        });
    
    });

    describe("Functionality of queryOracle", async () => {

        it("should only be accessible from within the contract", async () => {


        });

        it("should query the oracle and receive the oracle's rates.", async () => {
            let oracleRates = await sanityRatesAPR.queryOracle(token, ethAddress);
        });

    });

    describe("Functionality of getSanityRate", async () => {

        it("should return zero if it is not a token-ETH or ETH-token trade", async () => {

        });

        it("should return the rate if called with src ETH and dest token", async () => {

        });

        it("should return the rate if called with src token and dest ETH", async () => {

        });

        it("should return zero if called with the wrong token", async () => {

        });

        it("should return sanityRates unchanged when reasonableDiff is set to 0", async () => {
            return false;
        });

        it("should factor in reasonableDiff if reasonableDiff is not zero", async () => {

        });

        it("should use the oracle's rate and reasonableDiff to set the sanity rates", async () => {
            
        });

    });

    describe("Adversarial conditions", async () => {

        it("should not allow non-operator to set the Oracle", async () => {
            try {
                let userAsOracle = await SanityRatesAPR.setOracle(user);
                assert (false, "throw was expected in line above.");

            } catch (e){
                assert(Helper.isRevertErrorMessage(e), "expected throw but got: " + e);
            }

        });

        it("should not allow anyone besides the smart contract to call queryOracle", async() => {
        
        });

        it("should not allow anyone besides the operator to set sanityRates", async() => {

        });

    });

    // // also failing use cases, and successful cases
    // // checks for regression as well

    describe("Legacy from SanityRates", async () => {

        it("check rates for token 0 (where diff is 0) so only tests rates", async () => {
            let tokenToEthRate = await sanityRatesAPR.getSanityRate(token, ethAddress);
            Helper.assertEqual(tokenToEthRate, rate, "unexpected rate");
    
            let expectedEthToToken = precisionUnits.mul(precisionUnits).div(tokenToEthRate);
            let ethToTokenRate = await sanityRatesAPR.getSanityRate(ethAddress, token);
            Helper.assertEqual(expectedEthToToken, ethToTokenRate, "unexpected rate");
        });
    
    
        it("check rates with reasonable diff", async () => {
            let expectedTokenToEthRate = rate.mul(bps.add(reasonableDiff)).div(bps);
    
            let tokenToEthRate = await sanityRatesAPR.getSanityRate(token, ethAddress);
            Helper.assertEqual(tokenToEthRate, expectedTokenToEthRate, "unexpected rate");
    
            let expectedEthToToken = precisionUnits.mul(precisionUnits).div(rate).mul(bps.add(reasonableDiff)).div(bps);
            let ethToTokenRate = await sanityRatesAPR.getSanityRate(ethAddress, token);
            Helper.assertEqual(expectedEthToToken, ethToTokenRate, "unexpected rate");
        });
    
        it("should test can't init this contract with empty contracts (address 0)", async () => {
            let sanityRatess;
    
            try {
            sanityRatess = await SanityRatesAPR.new(zeroAddress);
            assert(false, "throw was expected in line above.")
            } catch(e){
            assert(Helper.isRevertErrorMessage(e), "expected throw but got: " + e);
            }
    
            sanityRatess = await SanityRatesAPR.new(admin);
        });
    
        it("should test can't init diffs when value > max diff (10000 = 100%)", async () => {
            reasonableDiff =  new BN(10001);
    
            try {
                await sanityRatesAPR.setReasonableDiff(reasonableDiff);
                assert(false, "throw was expected in line above.")
            } catch(e){
            assert(Helper.isRevertErrorMessage(e), "expected throw but got: " + e);
            }
    
            reasonableDiff = new BN(10000);
    
            await sanityRatesAPR.setReasonableDiff(reasonableDiff);
        });
    
        it("should test reverts when sanity rate > maxRate (10**24)", async function () {
            let legalRate = (new BN(10)).pow(new BN(24));
            let illegalRate = legalRate.add(new BN(1));
    
            rate = illegalRate;
    
            try {
                await sanityRatesAPR.setSanityRates(rate, {from: operator});
                assert(false, "throw was expected in line above.")
            } catch(e){
            assert(Helper.isRevertErrorMessage(e), "expected throw but got: " + e);
            }
    
            rate = legalRate;
            await sanityRatesAPR.setSanityRates(rate, {from: operator});
        });
    
        it("should test return rate 0 when both are token (no ether)", async function () {
            let rate0 = await sanityRatesAPR.getSanityRate(token, accounts[3]);
            Helper.assertEqual(rate0, 0, "0 rate expected");
            rate0 = await sanityRatesAPR.getSanityRate(accounts[2], token);
            Helper.assertEqual(rate0, 0, "0 rate expected");
            rate0 = await sanityRatesAPR.getSanityRate(token, accounts[4]);
            Helper.assertEqual(rate0, 0, "0 rate expected");
        });
    
    });




});



