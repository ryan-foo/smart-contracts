
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
        // SanityRatesAPR only supports one token, so I only set the rates for one toke

        rate = new BN(1).mul(precisionUnits.div(new BN(10)));
        reasonableDiff = new BN(100);

        console.log(reasonableDiff);

        sanityRatesAPR = await SanityRatesAPR.new(admin);
        await sanityRatesAPR.addOperator(operator);
        // await sanityRatesAPR.setSanityRates(token, reasonableDiff);

    });

    describe("", async() => {

    }
    );

    it("should return sanityRates unchanged when reasonableDiff is set to 0", async () => {
        return false;
    });

    // From SanityRates.sol
    it("check rates for token 0 (where diff is 0) so only tests rates.", async () => {
        let tokenToEthRate = await sanityRatesAPR.getSanityRate(token, ethAddress);
        Helper.assertEqual(tokenToEthRate, rate, "unexpected rate");

        let expectedEthToToken = precisionUnits.mul(precisionUnits).div(tokenToEthRate);
        let ethToTokenRate = await sanityRatesAPR.getSanityRate(ethAddress, token);
        Helper.assertEqual(expectedEthToToken, ethToTokenRate, "unexpected rate");
    });

    it("check rates with reasonable diff.", async () => {
        let expectedTokenToEthRate = rate.mul(bps.add(reasonableDiff)).div(bps);

        let tokenToEthRate = await sanityRatesAPR.getSanityRate(token, ethAddress);
        Helper.assertEqual(tokenToEthRate, expectedTokenToEthRate, "unexpected rate");

        let expectedEthToToken = precisionUnits.mul(precisionUnits).div(rate).mul(bps.add(reasonableDiff)).div(bps);
        let ethToTokenRate = await sanityRatesAPR.getSanityRate(ethAddress, token);
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
        reasonableDiff.push(8);
        try {
            await sanityRatesAPR.setReasonableDiff(token, reasonableDiff);
            assert(false, "throw was expected in line above.")
        } catch(e){
           assert(Helper.isRevertErrorMessage(e), "expected throw but got: " + e);
        }

        reasonableDiff.length = token.length;

        await sanityRatesAPR.setReasonableDiff(token, reasonableDiff);
    });

    it("should test can't init diffs when value > max diff (10000 = 100%).", async () => {
        reasonableDiff[0] =  new BN(10001);

        try {
            await sanityRatesAPR.setReasonableDiff(token, reasonableDiff);
            assert(false, "throw was expected in line above.")
        } catch(e){
           assert(Helper.isRevertErrorMessage(e), "expected throw but got: " + e);
        }

        reasonableDiff[0] = new BN(10000);;

        await sanityRatesAPR.setReasonableDiff(token, reasonableDiff);
    });

    it("should test reverts when sanity rate > maxRate (10**24).", async function () {
        let legalRate = (new BN(10)).pow(new BN(24));
        let illegalRate = legalRate.add(new BN(1));

        rate = illegalRate;

        try {
            await sanityRatesAPR.setSanityRates(token, rate, {from: operator});
            assert(false, "throw was expected in line above.")
        } catch(e){
           assert(Helper.isRevertErrorMessage(e), "expected throw but got: " + e);
        }

        rate = legalRate;
        await sanityRatesAPR.setSanityRates(token, rate, {from: operator});
    });

    it("should test return rate 0 when both are token (no ether).", async function () {
        let rate0 = await sanityRatesAPR.getSanityRate(token, accounts[3]);
        Helper.assertEqual(rate0, 0, "0 rate expected");
        rate0 = await sanityRatesAPR.getSanityRate(accounts[2], token);
        Helper.assertEqual(rate0, 0, "0 rate expected");
        rate0 = await sanityRatesAPR.getSanityRate(token, accounts[4]);
        Helper.assertEqual(rate0, 0, "0 rate expected");
    });

    it("should change the current oracle when you call setOracle with a valid address", async () => {
        let setOracle = await sanityRatesAPR.setOracle(address);
        // to do
        return setOracle;
    });

    it("should warn you when you set an invalid oracle address", async () => {
        // to do
        return false;
    });


    it("should query the oracle and receive the oracle's rates.", async () => {
        // to do
        let queryOracle = await sanityRatesAPR.queryOracle(token, ethAddress);
        return false;
    });

    it("should use the oracle's rate and reasonableDiff to set the sanity rates", async () => {
        // to do
        return false;
    });

    // describe("Testing Sanity Rate by getting and setting", async () => {
    //     return false;
    // });

    // // also failing use cases, and successful cases
    // // checks for regression as well

    describe("Sanity Rate is not set by the reserve manager", async () => {
        // high level that holds multiple tests
        // it("should return zero"), async() => {
        //     let rate = await sanityRatesAPR.getSanityRate(kncAddress, ethAddress);
        //     Helper.assertEqual(rate, zero, 'this is not zero');
        // }

        it("should alert that Sanity Rate is not set", async() => {
            return false;
        });

    });

});