
let SanityRatesAPR = artifacts.require("./SanityRatesAPR.sol")

const { zeroAddress } = require("../helper.js");
let Helper = require("../helper.js");
const BN = web3.utils.BN;
// const BN = ethers.BN;

const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

//global variables
const ethAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const kncAddress = "0xdd974D5C2e2928deA5F71b9825b8b646686BD200";
// We test with KNC
const precisionUnits = (new BN(10).pow(new BN(18)));
const bps = new BN(10000);

let sanityRatesAPR;
let admin;
let operator;
let oracle;
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
        oracle = accounts[5];
        // SanityRatesAPR only supports one token, so I only set the rates for one token

        rate = new BN(2).mul(precisionUnits.div(new BN(10)));
        reasonableDiff = new BN(10000);

        sanityRatesAPR = await SanityRatesAPR.new(admin, kncAddress);
        await sanityRatesAPR.addOperator(operator);
        await sanityRatesAPR.setSanityRates(rate, {from: operator});
        await sanityRatesAPR.setReasonableDiff(reasonableDiff);

    });

    describe("Initializing contract", async() => {

        it("should test can't init this contract with empty contracts (address 0).", async function () {
            let sanityRatess;
    
            try {
               sanityRatess = await SanityRatesAPR.new(zeroAddress, kncAddress);
               assert(false, "throw was expected in line above.")
            } catch(e){
               assert(Helper.isRevertErrorMessage(e), "expected throw but got: " + e);
            }
    
            sanityRatess = await SanityRatesAPR.new(admin, kncAddress);
        });

    });

    describe("Functionality of setReasonableDiff", async() => {
        it("should change reasonableDiff from the default reasonableDiff", async() => {
            expectedReasonableDiff = new BN(10000);
            reasonableDiff = await sanityRatesAPR.setReasonableDiff(new BN(10000), {from: admin}); // 10000 is 10%

            Helper.assertEqual(await sanityRatesAPR.reasonableDiffInBps(), expectedReasonableDiff);
        });

        it("should revert if called by user", async() => {
            try {
                await sanityRatesAPR.setReasonableDiff(new BN(10000), {from: user});

                assert (false, "throw was expected in line above.");

            } catch (e){
                assert(Helper.isRevertErrorMessage(e), "expected throw but got: " + e);
            }
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

    });

    describe("Functionality of setSanityRates", async() => {

        it("should set the Sanity Rates to the new rate", async () => {
            expectedSanityRate = new BN(150000);
            sanityRate = await sanityRatesAPR.setSanityRates(new BN(150000), {from: operator});

            Helper.assertEqual(await sanityRatesAPR.tokenRate(), expectedSanityRate);

        });

        it("should throw an error when presented with a negative sanity rate", async () => {
           
            try {
                await sanityRatesAPR.setSanityRates(-150000);

                assert (false, "throw was expected in line above.");

            } catch (e){
                assert(Helper.isRevertErrorMessage(e), "expected throw but got: " + e);
            }

        });

        it("should not accept sanity rate adjustments from a random user", async() => {

            try {
                await sanityRatesAPR.setSanityRates(new BN(150000), {from: user});

                assert (false, "throw was expected in line above.");

            } catch (e){
                assert(Helper.isRevertErrorMessage(e), "expected throw but got: " + e);
            }
        });

    });

    describe("Functionality of setOracle", async () => {

        // it("should change the current oracle when you call setOracle with a valid address", async () => {
        //     await sanityRatesAPR.setOracle(oracle, {from: operator});

        //     let expectedOracleAddress = oracle;
        //     return Helper.assertEqual(await sanityRatesAPR.oracleAddress(), expectedOracleAddress);
        // });
    
    //     it("should warn you when you set an invalid oracle address", async () => {
    //         // Accomplished by attempting to call the method specified by the oracle interface

    //         try {
    //             await sanityRatesAPR.setOracle(user, {from: operator});
    //             assert (false, "throw was expected in line above.");

    //         } catch (e){
    //             assert(Helper.isRevertErrorMessage(e), "expected throw but got: " + e);
    //         }
    //     });

        it("should not allow non-operator to set the Oracle", async () => {
            try {
                let userAsOracle = await sanityRatesAPR.setOracle(user);
                assert (false, "throw was expected in line above.");

            } catch (e){
                assert(Helper.isRevertErrorMessage(e), "expected throw but got: " + e);
            }
        });
    
    });

    // describe("Functionality of queryOracle", async () => {

    //     // this is not really working...

    //     it("should query the oracle and receive the oracle's rates", async () => {
    //         let expectedOracleRates = 10000;

    //         let oracleRates = await sanityRatesAPR.queryOracle(ethAddress, kncAddress);
    //         Helper.assertEqual(expectedOracleRates, oracleRates);
    //     });

    // });

    describe("Functionality of getSanityRate", async () => {

        it("should return rates for token when diff is 0", async () => {
            await sanityRatesAPR.setSanityRates(rate, {from: operator});
            await sanityRatesAPR.setReasonableDiff(0, {from: admin});

            let tokenToEthRate = await sanityRatesAPR.getSanityRate(token, ethAddress);

            Helper.assertEqual(tokenToEthRate, rate, "unexpected rate");
    
            let expectedEthToToken = precisionUnits.mul(precisionUnits).div(tokenToEthRate);

            let ethToTokenRate = await sanityRatesAPR.getSanityRate(ethAddress, token);
            Helper.assertEqual(expectedEthToToken, ethToTokenRate, "unexpected rate");
        });

        it("should return zero if called with the wrong token", async () => {
            let expectedSanityRate = 0;
            reasonableDiff = await sanityRatesAPR.setReasonableDiff(10000, {from:admin});
            sanityRate = await sanityRatesAPR.setSanityRates(100000, {from: operator});

            Helper.assertEqual(expectedSanityRate, await sanityRatesAPR.getSanityRate(ethAddress, user));

        });
        
        it("should test return rate 0 when both are token (no ether)", async function () {
            let rate0 = await sanityRatesAPR.getSanityRate(token, token);
            Helper.assertEqual(rate0, 0, "0 rate expected");
            rate0 = await sanityRatesAPR.getSanityRate(zeroAddress, token);
            Helper.assertEqual(rate0, 0, "0 rate expected");
            rate0 = await sanityRatesAPR.getSanityRate(token, zeroAddress);
            Helper.assertEqual(rate0, 0, "0 rate expected");
        });



        it("should return rates with reasonable diff", async () => {
            reasonableDiff = new BN(10000);

            let expectedTokenToEthRate = rate.mul(bps.add(reasonableDiff)).div(bps);

            await sanityRatesAPR.setSanityRates(rate, {from: operator});
            await sanityRatesAPR.setReasonableDiff(reasonableDiff, {from: admin});
    
            let tokenToEthRate = await sanityRatesAPR.getSanityRate(token, ethAddress);
            Helper.assertEqual(tokenToEthRate, expectedTokenToEthRate, "unexpected rate");
    
            let expectedEthToToken = precisionUnits.mul(precisionUnits).div(rate).mul(bps.add(reasonableDiff)).div(bps);
            let ethToTokenRate = await sanityRatesAPR.getSanityRate(ethAddress, token);
            Helper.assertEqual(expectedEthToToken, ethToTokenRate, "unexpected rate");
        });

        // it("should use the oracle's rate and reasonableDiff to set the sanity rates", async () => {
            
        // });

    });

    // also failing use cases, and successful cases
    // checks for regression as well
    
    //     it("should test reverts when sanity rate > maxRate (10**24)", async function () {
    //         let legalRate = (new BN(10)).pow(new BN(24));
    //         let illegalRate = legalRate.add(new BN(1));
    
    //         rate = illegalRate;
    
    //         try {
    //             await sanityRatesAPR.setSanityRates(rate, {from: operator});
    //             assert(false, "throw was expected in line above.")
    //         } catch(e){
    //         assert(Helper.isRevertErrorMessage(e), "expected throw but got: " + e);
    //         }
    
    //         rate = legalRate;
    //         await sanityRatesAPR.setSanityRates(rate, {from: operator});
    //     });
    
    //     it("should test return rate 0 when both are token (no ether)", async function () {
    //         let rate0 = await sanityRatesAPR.getSanityRate(token, accounts[3]);
    //         Helper.assertEqual(rate0, 0, "0 rate expected");
    //         rate0 = await sanityRatesAPR.getSanityRate(accounts[2], token);
    //         Helper.assertEqual(rate0, 0, "0 rate expected");
    //         rate0 = await sanityRatesAPR.getSanityRate(token, accounts[4]);
    //         Helper.assertEqual(rate0, 0, "0 rate expected");
    //     });
    
    // });




});



