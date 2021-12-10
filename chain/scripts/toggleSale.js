const {ethers} = require("hardhat");
const { CONTRACT_ADDRESS } = process.env;

async function main() {
    const [deployer] = await ethers.getSigners();

    const ZOO = await ethers.getContractFactory("ZOO");
    const zoo = await ZOO.attach(CONTRACT_ADDRESS);

    await zoo.toggleSaleStatus();
    console.log("Sale Toggled")
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });