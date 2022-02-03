const search = require('./Modules/search');
var cheerio = require("cheerio");
const fs = require('fs');
const express = require('express');
var app = express();
const port = 3000;

search.loadConfig();

app.use(express.static(__dirname + '/Website/manifest.json'));
app.use(express.static(__dirname + '/Website/assets/'));

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
                $('div.results-container').append(`<h2>${address} - ${validators.length} ETH2 Validators</h2><hr>`);
                for (let val of validators) {
                    $('div.results-container').append(val.toHTML());
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