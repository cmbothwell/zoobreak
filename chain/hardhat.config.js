/**
* @type import('hardhat/config').HardhatUserConfig
*/

require('dotenv').config();
// require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
require('hardhat-abi-exporter');
require("./scripts/generateAction")
const {generateAction} = require("./scripts/generateAction");
const {generateWalletRegistration} = require("./scripts/generateWalletRegistration");
const {generateAddressSign} = require("./scripts/generateAddressSign");
const {generateMintRequest} = require("./scripts/generateMintRequest");

const { RINKEBY_DEPLOYMENT_RPC_URL, RINKEBY_DEPLOYMENT_PRIVATE_KEY, UZH_DEPLOYMENT_RPC_URL, PRIVATE_KEY } = process.env;

task("sign-address", "Signs a wallet address for the backend")
  .setAction(async () => {
    const { address, signature } = await generateAddressSign()
    console.log("Address:", address);
    console.log("Signature:", signature);
   });

task("sign-wallet-reg", "Signs a wallet registration for the backend")
  .addParam("email", "Registrant email")
  .addParam("discord", "Registrant discord username")
  .addParam("twitter", "Registrant twitter handle")
  .setAction(async (taskArgs) => {
    const { wallet, signature } = await generateWalletRegistration(taskArgs.email, taskArgs.discord, taskArgs.twitter)
    console.log("Wallet:", wallet);
    console.log("Signature:", signature);
   });

task("sign-mint-request", "Signs a mint request for the backend")
  .addParam("quantity", "The number of tokens to mint")
  .setAction(async (taskArgs) => {
    const { mint_request, signature } = await generateMintRequest(taskArgs.quantity)
    console.log("Mint Request:", mint_request);
    console.log("Signature:", signature);
   });

task("sign-action", "Signs an action for the backend")
  .addParam("id", "Token ID for action")
  .addParam("type", "The specific type")
  .setAction(async (taskArgs) => {
    const { action, signature } = await generateAction(taskArgs.id, taskArgs.type)
    console.log("Action Object:", action);
    console.log("Signature:", signature);
   });

module.exports = {
   abiExporter: {
      path: './abi',
      clear: true,
      flat: true,
      only: [],
      spacing: 2,
      pretty: true,
   },
   solidity: {
      version: "0.8.4",
      settings: {
         optimizer: {
            enabled: true,
            runs: 1000,
         },
         outputSelection: {
            "*": {
               "*": [
                  "evm.bytecode",
                  "evm.deployedBytecode",
                  "abi"
               ]
            }
         }
      },
   },
   defaultNetwork: "localhost",
   networks: {
      hardhat: {},
      rinkeby: {
         url: RINKEBY_DEPLOYMENT_RPC_URL,
         accounts: [`${RINKEBY_DEPLOYMENT_PRIVATE_KEY}`]
      },
      uzh: {
          url: UZH_DEPLOYMENT_RPC_URL,
          accounts: [`${PRIVATE_KEY}`]
      }
   },
}