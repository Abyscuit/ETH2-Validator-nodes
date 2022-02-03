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
        var html = `<div><h3>Validator #${this.index}</h3><ul class="val-${this.index}">`;
        html += `<li><b>Date:</b> ${date}</li>`;
        html += `<li><b>Validator Pubkey:</b> <a href="${valURL}">${this.pubkey}</a></li>`;
        html += `<li><b>Deposit Transaction:</b> <a href="${txURL}">${this.hash}</a></li>`;
        html += `<li><b>Balance:</b> ${this.balance} ETH</li>`;
        html += `<li><b>Effective Balance:</b> ${this.effectiveBalance} ETH</li>`;
        html += `<li><b>Total Income:</b> ${this.rewardBalace} ETH</li>`;
        html += `<li><b>Status:</b> ${this.status}</li>`;
        html += `<li><b>Slashed:</b> ${this.slashed}</li>`;
        html += `<li><b><i>Eligible for Activation on Epoch ${this.eligibleEpoch}</i></b></li>`;
        html += `<li><b><i>Activated on Epoch ${this.activationEpoch}</i></b></li>`;
        html += '</ul></div>';
        return html;
    }
}

module.exports = validator;