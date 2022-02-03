class validator {
    constructor(timestamp, index, pubKey, hash, effectiveBalance, balance,
        status, eligibleEpoch, activatedEpoch, exitEpoch, withdrawalEpoch, slashed) {
        this.timestamp = timestamp;
        this.index = index;
        this.pubkey = pubKey;
        this.hash = hash;
        this.effectiveBalance = effectiveBalance;
        this.balance = balance;
        this.status = status;
        this.eligibleEpoch = eligibleEpoch;
        this.activationEpoch = activatedEpoch;
        this.exitEpoch = exitEpoch;
        this.withdrawalEpoch = withdrawalEpoch;
        this.slashed = slashed;
    }

    calculateRewards() {
        rewardBalace = balance - effectiveBalance;
        return rewardBalace;
    }

    updateInfo(index, effectiveBalance, balance, status, eligibleEpoch,
        activatedEpoch, exitEpoch, withdrawalEpoch, slashed) {
        this.index = index;
        this.effectiveBalance = effectiveBalance;
        this.balance = balance;
        this.rewardBalace = balance - effectiveBalance;
        this.status = status;
        this.eligibleEpoch = eligibleEpoch;
        this.activationEpoch = activatedEpoch;
        this.exitEpoch = exitEpoch;
        this.withdrawalEpoch = withdrawalEpoch;
        this.slashed = slashed;
    }

    convertTicksToDate(ticks) {
        var dStart = new Date(1970, 0, 1);
        dStart.setSeconds(ticks);
        return dStart.toLocaleString();
    }

    print() {
        var date = this.convertTicksToDate(this.timestamp);
        var valURL = `https://beaconscan.com/validator/${this.pubkey}`; // URL for the validator info
        var txURL = `https://etherscan.io/tx/${this.hash}`; // URL for the transaction info
        console.log(`Date: ${date}`);
        console.log(`Validator Index: ${this.index}`);
        console.log(`Validator Pubkey: ${this.pubkey}`);
        console.log(`Deposit Transaction: ${this.hash}`);
        console.log(`Transaction URL: ${txURL}`);
        console.log(`Validator URL: ${valURL}`);
        console.log(`Balance: ${this.balance} ETH`);
        console.log(`Effective Balance: ${this.effectiveBalance} ETH`);
        console.log(`Total Income: ${this.rewardBalace} ETH`);
        console.log(`Status: ${this.status}`);
        console.log(`Slashed: ${this.slashed}`);
        console.log(`Eligible for Activation on Epoch ${this.eligibleEpoch}`);
        console.log(`Activated on Epoch ${this.activationEpoch}`);
    }

    toHTML() {
        var date = this.convertTicksToDate(this.timestamp);
        var valURL = `https://beaconscan.com/validator/${this.pubkey}`; // URL for the validator info
        var txURL = `https://etherscan.io/tx/${this.hash}`; // URL for the transaction info
        var html = `<div class="col-md-4" style="padding: 30px 10px; overflow: hidden;"><h5 class="text-center">Validator #${this.index}</h5>`;
        html += `<span><b>Date:</b> ${date}</span><br>`;
        html += `<span><b>Validator Pubkey:</b><br>`;
        html += `<span><a href="${valURL}">${this.pubkey}</a></span><br>`;
        html += `<span><b>Deposit Transaction:</b></span><br>`
        html += `<span><a href="${txURL}">${this.hash}</a></span><br>`;
        html += `<span><b>Balance:</b> ${this.balance} ETH</span><br>`;
        html += `<span><b>Effective Balance:</b> ${this.effectiveBalance} ETH</span><br>`;
        html += `<span><b>Total Income:</b> ${this.rewardBalace} ETH</span><br>`;
        html += `<span><b>Status:</b> ${this.status}</span><br>`;
        html += `<span><b>Slashed:</b> ${this.slashed}</span><br>`;
        html += `<span><b><i>Eligible for Activation on Epoch ${this.eligibleEpoch}</i></b></span><br>`;
        html += `<span><b><i>Activated on Epoch ${this.activationEpoch}</i></b></span>`;
        html += '</div>';
        return html;
    }
}

module.exports = validator;