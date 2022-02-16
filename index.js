const search = require('./Modules/search');
var cheerio = require("cheerio");
const http = require('http');
const https = require('https');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
var app = express();
const port = 3000;

search.loadConfig();

app.use(cors());
app.use(express.static(__dirname + '/Website/assets'));

app.get(['/', '/index', '/index.html', '/search'], (req, res) => {
    var filePath = __dirname + "/Website/index.html";
    let address = req.query.address;
    if (address != undefined) {
        search.search(address, validators => {
            fs.readFile(filePath, 'utf8', function (err, data) {
                if (err) {
                    return console.log(err);
                }
                var $ = cheerio.load(data);
                var html = `<div style="padding: 20px;"><h4 class="text-center">` +
                    `${address} has 0 ETH2 Vaidators!` +
                    `</h4></div>`;
                if (validators.length == 0) {
                    $('div.container').append(html)
                }
                else {
                    if (validators[0] == "Not valid") {
                        html = `<div style="padding: 20px;"><h4 class="text-center">` +
                            `${address} is not a valid ETH1 Address!` +
                            `</h4></div>`;
                        $('div.container').append(html)
                    }
                    else {
                        for (let val of validators) {
                            $('div.row').append(val.toHTML());
                        }
                    }
                }

                res.set('Content-Type', 'text/html; charset=utf-8');
                res.send($.html());
            });
        });
    } else res.sendFile(filePath);
});

app.listen(port, () => {
    console.log(`ETH Validator Search listening on port ${port}`);
});