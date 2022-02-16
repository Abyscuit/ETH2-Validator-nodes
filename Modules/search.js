const validator = require('./validator');
const https = require('https');
const fs = require('fs');
var Web3 = require('web3');
const ethers = require('ethers');
const { setTimeout } = require('timers');
var web3 = new Web3(Web3.givenProvider || 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'); // -> web3.eth
const utils = web3.utils;
var BN = utils.BN;
const ETH2_DEPO_ADDR = "0x00000000219ab540356cBB839Cbe05303d7705Fa";
var page = 1;

// Create interface for contract
const ABI = fs.readFileSync(__dirname + '\\..\\JSON\\ETH2_Deposit_ABI.JSON'); // Contract ABI
const ABI_JSON = JSON.parse(ABI);
const inter = new ethers.utils.Interface(ABI_JSON);

// API settings
var ETHERSCAN_API_KEY = "";
var INFURA_PROJECT_SECRET = "";
var INFURA_PROJECT_ID = "";
const ETHERSCAN_SITE = "api.etherscan.io";
const ETHERSCAN_ENDPOINT = "/api";
const ETH2_API_SITE = "eth2-beacon-mainnet.infura.io";
var TRANSACTIONS = "";
var ETH2_VALIDATORS = new Array(); // ETH2 Validator array


function loadConfig() {
    var data = fs.readFileSync('Config/config.ini', 'utf8');
    var lines = data.split('\n');
    for (var i = 0; i < lines.length; i++) {
        var values = lines[i].split(':');
        if (values.length > 1) {
            var keyName = removeQuotes(values[0]);
            var value = removeQuotes(values[1]);
            value = value.replace("\r", "");
            if (keyName == "ETHERSCAN_API_KEY") { ETHERSCAN_API_KEY = value; }
            else if (keyName == "INFURA_PROJECT_ID") { INFURA_PROJECT_ID = value; }
            else if (keyName == "INFURA_PROJECT_SECRET") { INFURA_PROJECT_SECRET = value; }
        }
    }
}

function search(address, callback) {
    if (!isValidAddress(address)) {
        callback(new Array(["Not valid"]));
        return;
    }
    ETH2_VALIDATORS = new Array();
    console.log(`Searching ${address}`)
    getTransactions(address, callback);
}

function isValidAddress(address) {
    if (utils.isHexStrict(address)) {
        if (!utils.checkAddressChecksum(address)) {
            console.log("Address not checksummed");
            address = utils.toChecksumAddress(address);
        }
        if (utils.isAddress(address)) {
            return true;
        }
    }
    return false;
}

async function getTransactions(address, callback) {
    var txquery = "?module=account" +
        "&action=txlist" +
        `&address=${removeQuotes(address)}` +
        "&startblock=0" +
        "&endblock=99999999" +
        `&page=${page}` +
        "&offset=10000" +
        "&sort=asc" +
        `&apikey=${ETHERSCAN_API_KEY}`;
    var options = {
        hostname: ETHERSCAN_SITE,
        path: ETHERSCAN_ENDPOINT + txquery,
        port: 443,
        method: 'GET',
    }
    var req = https.request(options, res => {
        var data = '';
        res.on('data', d => {
            data += d.toString("ascii");
        })
        res.on('end', () => {
            var json = JSON.parse(data);
            TRANSACTIONS = json["result"];
            checkETH2Deposit(callback);
        })
    });
    req.on('error', error => {
        console.error(error)
    })
    req.end();
}

function getValidatorInfo(pubKeys, callback) {
    var query = "";
    for (var i = 0; i < pubKeys.length; i++) {
        if (i == 0) { query = '?'; }
        else { query += '&'; }
        query += `id=${pubKeys[i]}`;
    }
    var apiPath = `/eth/v1/beacon/states/head/validators${query}`;
    var auth = `${INFURA_PROJECT_ID}:${INFURA_PROJECT_SECRET}`;
    var encodedAuth = Buffer.from(auth).toString('base64');
    var options = {
        hostname: ETH2_API_SITE,
        path: apiPath,
        port: 443,
        method: 'GET',
        headers: {
            'authorization': `Basic ${encodedAuth}`
        }
    }
    https.get(options, res => {
        var data = '';
        res.on('data', d => {
            data += d.toString("ascii");
        });
        res.on('end', () => {
            var json = JSON.parse(data);
            processDepositData(json, callback);
        });
    }).on('error', error => {
        console.error(error)
    });
}


function removeQuotes(text) {
    var txt = text;
    while (txt.includes("\"")) {
        txt = txt.replace("\"", "");
    }
    return txt;
}

function checkETH2Deposit(callback) {
    var depoCount = 0; // The amount of deposits left to iterate through
    var pubKeys = new Array(); // Validator pubkeys array
    for (let transaction of TRANSACTIONS) {
        var addy = transaction["to"]
        if (addy.toLowerCase() == ETH2_DEPO_ADDR.toLowerCase()) { // You can only send deposit transactions
            // Check for failed transactions...
            var txnhash = transaction["hash"]
            depoCount++; // Increment the deposit count
            web3.eth.getTransactionReceipt(txnhash).then((value) => {
                // Get data for validator array
                var timestamp = transaction["timeStamp"];
                var log = value["logs"][0];
                var topics = log["topics"];
                var data = log["data"];
                var hash = log["transactionHash"];
                //var date = convertTicksToDate(timestamp);

                // Decode log data with contract ABI
                var decodedInput = inter.parseLog({ data, topics }); // LogDescription variable
                var args = decodedInput["args"]

                var pubKey = args["pubkey"]; // Validator pubkey
                var amtRaw = args["amount"]; // Amount staked in ETH
                var indRaw = args["index"];  // Validator index number
                var currentBalance = 0; // Balance of the validator
                var rewardBalace = 0; // Income from staking ETH2
                var effectiveBalance = 0; // Amount of ETH staking
                var status = ""; // Status of the validator
                var eligibleEpoch = ""; // Epoch when validator becomes eligible to activate
                var activatedEpoch = ""; // Epoch when validator gets activated
                var exitEpoch = ""; // Epoch when validator becomes eligible to exit
                var withdrawalEpoch = ""; // Epoch when validator becomes eligible to withdraw
                var slashed = ""; // Validator penalized for harmful behavior
                var amtBytes = Buffer.from(utils.hexToBytes(amtRaw)); // Convert the hex data to bytes
                var indBytes = Buffer.from(utils.hexToBytes(indRaw)); // Convert the hex data to bytes
                var amt = utils.fromWei(new BN(amtBytes.readBigUInt64LE()), "gwei"); // Amount of ETH staked
                var ind = indBytes.readBigInt64LE(); // Index of ETH2 validator - showing incorrect values to BeaconScan/Etherscan
                effectiveBalance = amt.toString();
                var index = ind.toString();
                pubKeys.push(pubKey);

                // Add validator to list 
                var val = new validator(
                    timestamp, index, pubKey, hash, effectiveBalance, currentBalance, rewardBalace,
                    status, eligibleEpoch, activatedEpoch, exitEpoch, withdrawalEpoch, slashed
                );
                ETH2_VALIDATORS.push(val);
                depoCount--;
                if (depoCount <= 0) { // Once finished with all deposit transactions
                    // Call function to process deposits and validators
                    getValidatorInfo(pubKeys, callback);
                }
            });
        }
    }
    if (depoCount > 0) console.log(`${depoCount} ETH2 Validators\n--------------------------------------------------\n`);
    else { console.log("No ETH2 Validators linked to this wallet address!"); callback(new Array()); }
    // If user has more than 10k transactions
    if (TRANSACTIONS.length == 10000) { page++; getTransactions(); }
    else page = 1;
}

function processDepositData(json, callback) {
    var valData = json["data"];
    var validated = new Array();
    for (let val of ETH2_VALIDATORS) {
        for (var i = 0; i < valData.length; i++) {
            var v = valData[i];
            var vi = v["validator"];
            var pubkey = vi["pubkey"];
            if (validated.includes(pubkey)) continue;
            if (pubkey == val.pubkey) {
                // Update validator info with ETH2 data
                val.updateInfo(v["index"], utils.fromWei(vi["effective_balance"], "gwei"), utils.fromWei(v["balance"], "gwei"), v["status"],
                    vi["activation_eligibility_epoch"], vi["activation_epoch"], vi["exit_epoch"], vi["withdrawal_epoch"], vi["slashed"]);
                validated.push(pubkey);
                //val.print();
                break;
            }
        }
    }
    callback(ETH2_VALIDATORS);
}

module.exports = { loadConfig, search };