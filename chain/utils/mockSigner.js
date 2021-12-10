const { ethers } = require("ethers");
require('dotenv').config();

const { PRIVATE_KEY, TAMPER_PRIVATE_KEY  } = process.env;

const getMintRequest = async (sender, quantity, tamper=false, sameNonce=false) => {
    wallet = tamper ? new ethers.Wallet(TAMPER_PRIVATE_KEY) : new ethers.Wallet(PRIVATE_KEY)

    const generateRandomNonce = (length) => {
        const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var result = '';
        for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
        return result;
    }

    var nonce = sameNonce ? "VdMZQcKcT8zgWpsXeC8roohGfd0CpRxA" : generateRandomNonce(32);
    let payload = ethers.utils.defaultAbiCoder.encode([ "address", "uint256" , "string"], [ sender, quantity, nonce ]);

    // Manually constructing the message hash, for safety reasons the signer does this itself
    let messageHash = ethers.utils.solidityKeccak256(['string', 'bytes'], ['\x19Ethereum Signed Message:\n160', payload])
    let signature = await wallet.signMessage(ethers.utils.arrayify(payload));

    return {
        'sender': sender,
        'quantity': quantity,
        'nonce': nonce,
        'hash': messageHash,
        'signature': signature
    }
}

const getLoveRequest = async (sender, amount, tamper=false, sameNonce=false) => {
    wallet = tamper ? new ethers.Wallet(TAMPER_PRIVATE_KEY) : new ethers.Wallet(PRIVATE_KEY)

    const generateRandomNonce = (length) => {
        const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var result = '';
        for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
        return result;
    }

    var nonce = sameNonce ? "VdMZQcKcT8zgWpsXeC8roohGfd0CpRxA" : generateRandomNonce(32);
    let payload = ethers.utils.defaultAbiCoder.encode([ "address", "uint256" , "string"], [ sender, amount, nonce ]);

    // Manually constructing the message hash, for safety reasons the signer does this itself
    let messageHash = ethers.utils.solidityKeccak256(['string', 'bytes'], ['\x19Ethereum Signed Message:\n160', payload])
    let signature = await wallet.signMessage(ethers.utils.arrayify(payload));

    return {
        'sender': sender,
        'amount': amount,
        'nonce': nonce,
        'hash': messageHash,
        'signature': signature
    }
}

exports.getMintRequest = getMintRequest;
exports.getLoveRequest = getLoveRequest;
