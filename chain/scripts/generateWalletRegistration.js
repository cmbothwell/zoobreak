const { ethers } = require("ethers");
const { PRIVATE_KEY } = process.env;

async function generateWalletRegistration(email, discord, twitter) {
    const wallet = new ethers.Wallet(PRIVATE_KEY)
    const address = await wallet.getAddress()

    const walletRegistrationObject = {
        "address": address,
        "email": email,
        "discord": discord,
        "twitter": twitter,
    }

    const walletRegistrationObjectString = JSON.stringify(walletRegistrationObject);
    const signature = await wallet.signMessage(walletRegistrationObjectString);

    return {
        "wallet": walletRegistrationObject,
        "signature": signature,
    }
}

exports.generateWalletRegistration = generateWalletRegistration;