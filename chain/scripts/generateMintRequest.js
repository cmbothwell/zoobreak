const { ethers } = require("ethers");
const { PRIVATE_KEY } = process.env;

async function generateMintRequest(quantity) {
    const wallet = new ethers.Wallet(PRIVATE_KEY)
    const address = await wallet.getAddress()

    const mintRequest = {
        'address': address,
        'quantity': parseInt(quantity),
    }

    const mintRequestString = JSON.stringify(mintRequest);
    const signature = await wallet.signMessage(mintRequestString);

    return {
        "mint_request": mintRequest,
        "signature": signature,
    }
}

exports.generateMintRequest = generateMintRequest;