const BN = web3.utils.BN
const Helper = require('../../test/helper.js')
const {precisionUnits} = require('../../test/helper.js')

const {
  getEpochNumber,
  CAMPAIGN_TYPE_GENERAL,
  CAMPAIGN_TYPE_NETWORK_FEE,
  CAMPAIGN_TYPE_FEE_BRR
} = require('./daoActionsGenerator.js')

let campaignData = {}
let epochCampaigns = {}
let totalEpochPoints = {}
let numberVotes = {}
let stakerVotedOption = {}
let networkFeeCampaigns = {}
let brrCampaigns = {}

module.exports = {
  campaignData,
  epochCampaigns,
  totalEpochPoints,
  numberVotes,
  stakerVotedOption,
  networkFeeCampaigns,
  brrCampaigns
}

let startTime
let epochPeriod
let numberCampaigns = new BN(0)

module.exports.setTime = function (_startTime, _epochPeriod) {
  startTime = _startTime
  epochPeriod = _epochPeriod
}

module.exports.submitCampaign = function (
  campType,
  startCampaignTime,
  endCampaignTime,
  minPercentageInPrecision,
  cInPrecision,
  tInPrecision,
  options,
  totalKNCSupply
) {
  numberCampaigns = numberCampaigns.add(new BN(1))
  let epoch = getEpochNumber(epochPeriod, startTime, startCampaignTime)
  let campaignId = numberCampaigns
  if (epoch in epochCampaigns) {
    epochCampaigns[epoch].push(campaignId)
  } else {
    epochCampaigns[epoch] = [campaignId]
  }

  if (campType == CAMPAIGN_TYPE_NETWORK_FEE) {
    networkFeeCampaigns[epoch] = campaignId
  } else if (campType == CAMPAIGN_TYPE_FEE_BRR) {
    brrCampaigns[epoch] = campaignId
  }

  votePerOption = []
  for (let i = 0; i < options.length; i++) votePerOption.push(new BN(0))

  campaignVoteData = {
    totalVotes: new BN(0),
    votePerOption
  }

  campaignData[campaignId] = {
    campaignType: campType,
    campaignId,
    startTimestamp: startCampaignTime,
    endTimestamp: endCampaignTime,
    minPercentageInPrecision,
    cInPrecision,
    tInPrecision,
    options: options,
    totalKNCSupply: totalKNCSupply,
    campaignVoteData
  }
}

module.exports.cancelCampaign = function (campaignId) {
  assert(campaignId in campaignData, 'campaignId not exist')
  campaign = campaignData[campaignId]
  let epoch = getEpochNumber(epochPeriod, startTime, campaign.startTimestamp)
  if (campaign.campaignType == CAMPAIGN_TYPE_NETWORK_FEE) {
    assert(epoch in networkFeeCampaigns, 'networkFeeCampaigns is not exist')
    delete networkFeeCampaigns[epoch]
  } else if (campaign.campaignType == CAMPAIGN_TYPE_FEE_BRR) {
    assert(epoch in brrCampaigns, 'brrCampaigns is not exist')
    delete brrCampaigns[epoch]
  }

  delete campaignData[campaignId]
  assert(epoch in epochCampaigns, 'epochCampaigns is not exist')
  let campaignIds = epochCampaigns[epoch]
  for (let i = 0; i < campaignIds.length; i++) {
    if (campaignIds[i] == campaignId) {
      campaignIds[i] = campaignIds[campaignIds.length - 1]
      campaignIds.pop()
      break
    }
  }
}

module.exports.vote = function (campaignId, option, staker, totalStake, epoch) {
  let lastVotedOption = undefined
  if (staker in stakerVotedOption) {
    if (campaignId in stakerVotedOption[staker]) {
      lastVotedOption = stakerVotedOption[staker][campaignId]
    }
  }

  assert(campaignId in campaignData, 'campaignId is not exist')
  let voteData = campaignData[campaignId].campaignVoteData
  if (lastVotedOption == undefined) {
    // increase number campaigns that the staker has voted at the current epoch
    if (!(staker in numberVotes)) numberVotes[staker] = {}
    addValueToDictionay(numberVotes[staker], epoch, new BN(1))
    addValueToDictionay(totalEpochPoints, epoch, totalStake)
    voteData.votePerOption[option.sub(new BN(1))] = voteData.votePerOption[option.sub(new BN(1))].add(totalStake)
    voteData.totalVotes = voteData.totalVotes.add(totalStake)
  } else {
    voteData.votePerOption[lastVotedOption.sub(new BN(1))] = voteData.votePerOption[
      lastVotedOption.sub(new BN(1))
    ].sub(totalStake)

    voteData.votePerOption[option.sub(new BN(1))] = voteData.votePerOption[option.sub(new BN(1))].add(totalStake)
  }

  if (!(staker in stakerVotedOption)) stakerVotedOption[staker] = {}
  stakerVotedOption[staker][campaignId] = option
}

module.exports.getCampaignWinningOptionAndValue = function (campaignID, currentBlockTime) {
  assert(campaignID in campaignData, 'campaignData is not exist')
  campaign = campaignData[campaignID]
  let totalSupply = campaign.totalKNCSupply
  Helper.assertGreater(totalSupply, new BN(0), 'zero total supply')
  let totalVotes = campaign.campaignVoteData.totalVotes
  let voteCounts = campaign.campaignVoteData.votePerOption
  console.log(`campaign ${campaignID} has totalVote=${totalVotes} voteCounts=${voteCounts} totalSuppy=${totalSupply}`)
  let winOption = new BN(0)
  let maxVotedCount = new BN(0)
  for (let i = 0; i < voteCounts.length; i++) {
    if (voteCounts[i].gt(maxVotedCount)) {
      winOption = new BN(i + 1)
      maxVotedCount = voteCounts[i]
    } else if (voteCounts[i].eq(maxVotedCount)) {
      winOption = new BN(0)
    }
  }

  if (winOption.eq(new BN(0))) {
    return [new BN(0), new BN(0), campaign.campaignType]
  }

  let votedPercentage = totalVotes.mul(precisionUnits).div(totalSupply)
  if (campaign.minPercentageInPrecision.gt(votedPercentage)) {
    return [new BN(0), new BN(0), campaign.campaignType]
  }

  let x = campaign.tInPrecision.mul(votedPercentage).div(precisionUnits)
  if (!x.gt(campaign.cInPrecision)) {
    let y = campaign.cInPrecision.sub(x)
    if (maxVotedCount.mul(precisionUnits).lt(y.mul(totalVotes))) {
      return [new BN(0), new BN(0), campaign.campaignType]
    }
  }
  return [winOption, campaign.options[winOption.sub(new BN(1))], campaign.campaignType]
}

function addValueToDictionay (dic, key, value) {
  if (key in dic) {
    dic[key] = dic[key].add(value)
  } else {
    dic[key] = value
  }
}

function subValueToDictionay (dic, key, value) {
  if (key in dic) {
    dic[key] = dic[key].sub(value)
  } else {
    dic[key] = value
  }
}

module.exports.handlewithdraw = async function (staker, reduceAmount, epoch, currentBlockTime) {
  if (!(staker in numberVotes)) return
  if (!(epoch in numberVotes[staker])) return
  //if numberVotes contains value for state and epoch, that mean numVotes!=0
  numVote = numberVotes[staker][epoch]
  subValueToDictionay(totalEpochPoints, epoch, reduceAmount.mul(numVote))

  if (!(epoch in epochCampaigns)) return
  let campaignIds = epochCampaigns[epoch]

  for (const campaignId of campaignIds) {
    if (!(staker in stakerVotedOption)) continue
    if (!(campaignId in stakerVotedOption[staker])) continue

    votedOption = stakerVotedOption[staker][campaignId]

    assert(campaignId in campaignData, 'campaign not exits')
    let campaign = campaignData[campaignId]
    // check if campaign has ended
    if (campaign.endTimestamp < currentBlockTime) continue
    campaign.campaignVoteData.totalVotes = campaign.campaignVoteData.totalVotes.sub(reduceAmount)
    campaign.campaignVoteData.votePerOption[votedOption.sub(new BN(1))] = campaign.campaignVoteData.votePerOption[
      votedOption.sub(new BN(1))
    ].sub(reduceAmount)
  }
}
