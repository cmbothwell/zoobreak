const { ethers } = require("ethers");
const { PRIVATE_KEY } = process.env;

async function generateAction(id, type) {
    const wallet = new ethers.Wallet(PRIVATE_KEY)

    const action = {
        'id': parseInt(id),
        'type': type,
    }

    const actionString = JSON.stringify(action);
    const signature = await wallet.signMessage(actionString);

    return {
        "action": action,
        "signature": signature,
    }
}

exports.generateAction = generateAction;