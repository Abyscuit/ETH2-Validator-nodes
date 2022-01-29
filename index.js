var path = require('path')
const https = require('https')
const fs = require('fs');
var Web3 = require('web3');
var Eth = require('web3-eth');
const ethers = require('ethers');
const { parseBytes32String } = require('@ethersproject/strings');
// "Eth.providers.givenProvider" will be set if in an Ethereum supported browser.
var eth = new Eth(Eth.givenProvider || 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161');
// or using the web3 umbrella package
var web3 = new Web3(Web3.givenProvider || 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'); // -> web3.eth
const utils = web3.utils;
var BN = utils.BN;
const ETH2_DEPO_ADDR = "0x00000000219ab540356cBB839Cbe05303d7705Fa";
var testaddr = "0x14622Fe342Afe700419A7995223e305b3dad5795";
var page = 1;

// Create interface for contract
const ABI = fs.readFileSync(__dirname + '\\JSON\\ETH2_Deposit_ABI.JSON'); // Contract ABI
const ABI_JSON = JSON.parse(ABI);
const inter = new ethers.utils.Interface(ABI_JSON);

var ETHERSCAN_API_KEY = "";
var INFURA_ETH2_API_KEY = "";
const ETHERSCAN_SITE = "api.etherscan.io";
const ETHERSCAN_ENDPOINT = "/api"
var TRANSACTIONS = "";
var DEPOSITS = "";

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});


function loadConfig() {
    const data = fs.readFileSync('Config/config.ini', 'utf8');
    var lines = data.split('\n');
    for (var i = 0; i < lines.length; i++) {
        var values = lines[i].split(':');
        if (values.length > 1) {
            var keyName = removeQuotes(values[0]);
            var value = removeQuotes(values[1]);
            if (keyName == "ETHERSCAN_API_KEY") { ETHERSCAN_API_KEY = value; }
            else if (keyName == "INFURA_ETH2_API_KEY") { INFURA_ETH2_API_KEY = value; }
        }
    }

    readline.question('Enter an address to search for ETH2 validators: ', addr => {
        if (addr != "") testaddr = addr;
        console.log(`Searching ${testaddr} for ETH2 validators!`);
        readline.close();
        getTransactions();
    });
}

function getTransactions() {
    var txquery = "?module=account" +
        "&action=txlist" +
        `&address=${removeQuotes(testaddr)}` +
        "&startblock=0" +
        "&endblock=99999999" +
        `&page=${page}` +
        "&offset=10000" +
        "&sort=asc" +
        `&apikey=${ETHERSCAN_API_KEY}`;

    const options = {
        hostname: ETHERSCAN_SITE,
        path: ETHERSCAN_ENDPOINT + txquery,
        port: 443,
        method: 'GET',
    }
    const req = https.request(options, res => {
        var data = '';
        res.on('data', d => {
            data += d.toString("ascii");
        })
        res.on('end', () => {
            var json = JSON.parse(data);
            TRANSACTIONS = json["result"];
            checkETH2Deposit();
        })
    });

    req.on('error', error => {
        console.error(error)
    })

    req.end()

}
function removeQuotes(text) {
    var txt = text;
    while (txt.includes("\"")) {
        txt = txt.replace("\"", "");
    }
    return txt;
}

function checkETH2Deposit() {
    var depoCount = 0; // The amount of deposits left to iterate through
    var ETH2_VALIDATORS = "["; // Start JSON File
    DEPOSITS = "["; // Start JSON File
    for (let transaction of TRANSACTIONS) {
        var addy = transaction["to"]
        if (addy.toLowerCase() == ETH2_DEPO_ADDR.toLowerCase()) { // You can only send deposit transactions
            // Check for failed transactions...
            var txnhash = transaction["hash"]
            depoCount++; // Increment the deposit count
            web3.eth.getTransactionReceipt(txnhash).then((value) => {
                DEPOSITS += JSON.stringify(value) + ","; // Add deposit to list

                // Can either wait for promises to complete and
                // use the DEPOSITS/ETH2_VALIDATORS lists or
                // do it live...
                var timestamp = transaction["timeStamp"];
                var log = value["logs"][0];
                var topics = log["topics"];
                var data = log["data"];
                var hash = log["transactionHash"];
                var date = convertTicksToDate(timestamp);

                // Decode log data with contract ABI
                const decodedInput = inter.parseLog({ data, topics }); // LogDescription variable
                const args = decodedInput["args"]

                var pubKey = args["pubkey"]; // Validator pubkey
                var amtRaw = args["amount"]; // Amount staked in ETH
                var indRaw = args["index"];  // Validator index number
                var amtBytes = Buffer.from(utils.hexToBytes(amtRaw)); // Convert the hex data to bytes
                var indBytes = Buffer.from(utils.hexToBytes(indRaw)); // Convert the hex data to bytes
                var amt = utils.fromWei(new BN(amtBytes.readBigUInt64LE()), "gwei"); // Amount of ETH staked
                var ind = indBytes.readBigInt64LE(); // Index of ETH2 validator - showing incorrect values to BeaconScan/Etherscan
                var valURL = `https://beaconscan.com/validator/${pubKey}`; // URL for the validator info
                var txURL = `https://etherscan.io/tx/${hash}`; // URL for the transaction info

                // Print validator information
                console.log(`${depoCount})`);
                console.log(`Date: ${date}`);
                //console.log(`Validator Index: ${ind}`);
                console.log(`Validator Pubkey: ${pubKey}`);
                //console.log(`Amount Deposited: ${amt} ETH`);
                console.log(`Validator URL: ${valURL}`);
                console.log(`Deposit Transaction: ${hash}`);
                console.log(`Transaction URL: ${txURL}\n`);
                var amount = amt.toString();
                var index = ind.toString();

                // Create validator list for future uses
                var validator = { timestamp, index, pubKey, amount, hash }; // Deposit transaction variable
                ETH2_VALIDATORS += JSON.stringify(validator) + ",";
                depoCount--;
                if (depoCount <= 0) { // Once finished with all deposit transactions
                    DEPOSITS = DEPOSITS.substring(0, DEPOSITS.length - 1); // Remove remaining commma
                    DEPOSITS += "]"; // Close JSON
                    ETH2_VALIDATORS = ETH2_VALIDATORS.substring(0, ETH2_VALIDATORS.length - 1); // Remove remaining commma
                    ETH2_VALIDATORS += "]"; // Close JSON

                    // Ask if want to search again...
                }
            });
        }
    }
    if (depoCount > 0) console.log(`ETH2 Validators\n--------------------------------------------------\n`);
    else console.log("No ETH2 Validators linked to this wallet address!");
    // If user has more than 10k transactions
    if (TRANSACTIONS.length == 10000) { page++; getTransactions(); }
    else page = 1;
}

function convertTicksToDate(ticks) {
    var dStart = new Date(1970, 0, 1);
    dStart.setSeconds(ticks);
    return dStart.toLocaleString();
}

loadConfig();