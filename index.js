var path = require('path')
const web3 = require('web3')
const fs = require('fs')
var port = 3000
const eth2depoaddr = "0x00000000219ab540356cBB839Cbe05303d7705Fa";
var testaddr = "0x14622Fe342Afe700419A7995223e305b3dad5795";

fs.readFile('Config/config.ini', 'utf8', (err, data) => {
    if (err) {
        console.error(err)
        return
    }
    var lines = data.split('\n');
    var values = lines[1].split(':');
    if (values.length > 1) console.log(`${values[0]}:${values[1]}`);
});
/*
const etherscan_endpoint = "https://api.etherscan.io/api" +
    "?module=account" +
    "&action=txlist" +
    `& address=${ testaddr }` +
    "&startblock=0" +
    "&endblock=99999999" +
    "&page=1" +
    "&offset=10" +
    "&sort=asc" +
    `& apikey=${ YourApiKeyToken }`;

web3.eth.getPastLogs({
    address: testaddr
})
    .then(console.log);
    */