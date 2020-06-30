// We can change all the naming to SanityRatesAPR later.
let SanityRatesAPR = artifacts.require("./SanityRatesAPR.sol")

const { zeroAddress } = require("../helper.js");
let Helper = require("../helper.js");
const BN = web3.utils.BN;

const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');


//global variables
const ethAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const kncAddress = '0xdd974D5C2e2928deA5F71b9825b8b646686BD200';
const precisionUnits = (new BN(10).pow(new BN(18)));
const bps = new BN(10000);

let sanityRates;
let admin;
let operator;
let numTokens = 1;
let tokens = [];
let rates = [];
let reasonableDiffs = [];

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
        user = accounts[0];
        // tokens[0] = accounts[1];
        // tokens[1] = accounts[2];
        // tokens[2] = accounts[3];
        // tokens[3] = accounts[4];
        operator = accounts[5];
        admin = accounts[6];
        storage = accounts[7];
        // dao = accounts[8];

        // SanityRatesAPR only supports one token, so I only set the rates for one token

        for (let i = 0; i < numTokens; i++) {
            tokens[i] = accounts[i + 1];
            rates[i] = (new BN(i + 1)).mul(precisionUnits.div(new BN(10)));
            reasonableDiffs[i] = new BN(i * 100);
        }

        for (let i = 0; i < numTokens; i++) {
            console.log(reasonableDiffs[i]);
        }

        sanityRatesAPR = await SanityRatesAPR.new(admin);
        await sanityRatesAPR.addOperator(operator);
        await sanityRatesAPR.setSanityRates(tokens, reasonableDiffs);
    });

    it("should return sanityRates unchanged when reasonableDiff is set to 0"), async () => {
    };

    // From SanityRates.sol
    it("check rates for token 0 (where diff is 0) so only tests rates.", async () => {
        let tokenToEthRate = await sanityRatesAPR.getSanityRate(tokens[0], ethAddress);
        Helper.assertEqual(tokenToEthRate, rates[0], "unexpected rate");

        let expectedEthToToken = precisionUnits.mul(precisionUnits).div(tokenToEthRate);
        let ethToTokenRate = await sanityRatesAPR.getSanityRate(ethAddress, tokens[0]);
        Helper.assertEqual(expectedEthToToken, ethToTokenRate, "unexpected rate");
    });

    it("check rates with reasonable diff.", async () => {
        let tokenInd = 1;
        let expectedTokenToEthRate = rates[tokenInd].mul(bps.add(reasonableDiffs[tokenInd])).div(bps);

        let tokenToEthRate = await sanityRatesAPR.getSanityRate(tokens[tokenInd], ethAddress);
        Helper.assertEqual(tokenToEthRate, expectedTokenToEthRate, "unexpected rate");

        let expectedEthToToken = precisionUnits.mul(precisionUnits).div(rates[tokenInd]).mul(bps.add(reasonableDiffs[tokenInd])).div(bps);
        let ethToTokenRate = await sanityRatesAPR.getSanityRate(ethAddress, tokens[tokenInd]);
        Helper.assertEqual(expectedEthToToken, ethToTokenRate, "unexpected rate");
    });

    it("should test can't init this contract with empty contracts (address 0).", async () => {
        let sanityRatess;

        try {
           sanityRatess = await SanityRatesAPR.new(zeroAddress);
           assert(false, "throw was expected in line above.")
        } catch(e){
           assert(Helper.isRevertErrorMessage(e), "expected throw but got: " + e);
        }

        sanityRatess = await SanityRatesAPR.new(admin);
    });

    it("should test can't init diffs when array lengths aren't the same.", async () => {
        reasonableDiffs.push(8);
        try {
            await sanityRatesAPR.setReasonableDiff(tokens, reasonableDiffs);
            assert(false, "throw was expected in line above.")
        } catch(e){
           assert(Helper.isRevertErrorMessage(e), "expected throw but got: " + e);
        }

        reasonableDiffs.length = tokens.length;

        await sanityRatesAPR.setReasonableDiff(tokens, reasonableDiffs);
    });

    it("should test can't init diffs when value > max diff (10000 = 100%).", async () => {
        reasonableDiffs[0] =  new BN(10001);

        try {
            await sanityRatesAPR.setReasonableDiff(tokens, reasonableDiffs);
            assert(false, "throw was expected in line above.")
        } catch(e){
           assert(Helper.isRevertErrorMessage(e), "expected throw but got: " + e);
        }

        reasonableDiffs[0] = new BN(10000);;

        await sanityRatesAPR.setReasonableDiff(tokens, reasonableDiffs);
    });

    it("should test can't init rates when array lengths aren't the same.", async function () {
        rates.push(new BN(8));
        try {
            await sanityRatesAPR.setSanityRates(tokens, rates, {from: operator});
            assert(false, "throw was expected in line above.")
        } catch(e){
           assert(Helper.isRevertErrorMessage(e), "expected throw but got: " + e);
        }

        rates.length = tokens.length;

        await sanityRatesAPR.setSanityRates(tokens, rates, {from: operator});
    });

    it("should test reverts when sanity rate > maxRate (10**24).", async function () {
        let legalRate = (new BN(10)).pow(new BN(24));
        let illegalRate = legalRate.add(new BN(1));

        rates[0] = illegalRate;

        try {
            await sanityRatesAPR.setSanityRates(tokens, rates, {from: operator});
            assert(false, "throw was expected in line above.")
        } catch(e){
           assert(Helper.isRevertErrorMessage(e), "expected throw but got: " + e);
        }

        rates[0] = legalRate;
        await sanityRatesAPR.setSanityRates(tokens, rates, {from: operator});
    });

    it("should test return rate 0 when both are tokens (no ether).", async function () {
        let rate0 = await sanityRatesAPR.getSanityRate(tokens[1], tokens[2]);
        Helper.assertEqual(rate0, 0, "0 rate expected");
        rate0 = await sanityRatesAPR.getSanityRate(tokens[0], tokens[1]);
        Helper.assertEqual(rate0, 0, "0 rate expected");
        rate0 = await sanityRatesAPR.getSanityRate(tokens[2], tokens[3]);
        Helper.assertEqual(rate0, 0, "0 rate expected");
    });

    it("should change the current oracle when you call setOracle with a valid address"), async () => {
        let setOracle = await sanityRatesAPR.setOracle(address);
        // to do
        return setOracle;
    };

    it("should warn you when you set an invalid oracle address"), async () => {
        // to do
        return false;
    }


    it("should query the oracle and receive the oracle's rates."), async () => {
        // to do
        let queryOracle = await sanityRatesAPR.queryOracle(tokens[1], tokens[2]);
        return false;
    }

    it("should use the oracle's rate and reasonableDiff to set the sanity rates"), async () => {
        // to do
        return false;
    }

    describe("Testing Sanity Rate by getting and setting"), async () => {
        return false;
    }

    // also failing use cases, and successful cases
    // checks for regression as well

    describe("Sanity Rate is not set by the reserve manager"), async () => {
        // high level that holds multiple tests
        it("should return zero"), async() => {
            let rate = await sanityRatesAPR.getSanityRate(kncAddress, ethAddress);
            Helper.assertEqual(rate, zero, 'this is not zero');
        }

        it("should alert that Sanity Rate is not set"), async() => {
            return false;
        }

    }

});