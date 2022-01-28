var path = require('path')
var Eth = require('web3-eth');
// "Eth.providers.givenProvider" will be set if in an Ethereum supported browser.
var eth = new Eth(Eth.givenProvider || 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161');
// or using the web3 umbrella package
var Web3 = require('web3');
var web3 = new Web3(Web3.givenProvider || 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'); // -> web3.eth
const https = require('https')
const fs = require('fs');
const ETH2_DEPO_ADDR = "0x00000000219ab540356cBB839Cbe05303d7705Fa";
var testaddr = "0x14622Fe342Afe700419A7995223e305b3dad5795";

const ethers = require('ethers');
const ABI = fs.readFileSync(__dirname + '\\JSON\\ETH2_Deposit_ABI.JSON'); // Contract ABI
const ABI_JSON = JSON.parse(ABI);
const inter = new ethers.utils.Interface(ABI_JSON);

var ETHERSCAN_API_KEY = "";
const ETHERSCAN_SITE = "api.etherscan.io";
const ETHERSCAN_ENDPOINT = "/api"
var TRANSACTIONS = "";

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
            if (keyName == "ETHERSCAN_API_KEY") {
                ETHERSCAN_API_KEY = value;
            }
        }
    }

    readline.question('Enter an address to search for ETH2 validators:', addr => {
        console.log(`Searching ${addr} for ETH2 validators!`);
        testaddr = addr;
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
        "&page=1" +
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
    console.log("ETH2 Deposits:");
    for (let transaction of TRANSACTIONS) {
        var addy = transaction["to"]
        if (addy.toLowerCase() == ETH2_DEPO_ADDR.toLowerCase()) {
            var txnhash = transaction["hash"]
            web3.eth.getTransactionReceipt(txnhash).then((value) => {
                var timestamp = transaction["timeStamp"];
                var ethAmt = transaction["value"]
                var d = value["logs"][0];
                var topics = d["topics"];
                var data = d["data"];
                const decodedInput = inter.parseLog({ data, topics });
                var pubKey = decodedInput["args"][0]
                console.log(`Txn Hash: ${d["transactionHash"]} | ETH2 PubKey: ${pubKey}`);
                // https://etherscan.io/tx/
                // https://beaconscan.com/validator/
                console.log(`https://etherscan.io/tx/${d["transactionHash"]}\nhttps://beaconscan.com/validator/${pubKey}\n`);
            });
        }
    }
}

function convertTicksToDate(ticks) {
    var dStart = new Date(1970, 0, 1);
    dStart.setSeconds(ticks);
    return dStart.toLocaleString();
}


loadConfig();