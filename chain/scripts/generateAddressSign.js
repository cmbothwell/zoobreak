const { ethers } = require("ethers");
const { PRIVATE_KEY } = process.env;

async function generateAddressSign() {
    const wallet = new ethers.Wallet(PRIVATE_KEY)
    const address = await wallet.getAddress()

    const signature = await wallet.signMessage(address);

    return {
        "address": address,
        "signature": signature,
    }
}

exports.generateAddressSign = generateAddressSign;