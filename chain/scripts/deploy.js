const {ethers} = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const ZOO = await ethers.getContractFactory("ZOO");
    const zoo = await ZOO.deploy();
    const zooAddress = zoo.address

    console.log(await zoo.deployTransaction.wait())

    console.log("Zoo contract deployed to address:", zooAddress);

    const LOVE = await ethers.getContractFactory("LOVE");
    const love = await LOVE.deploy(zooAddress);
    const loveAddress = love.address

    console.log("Love contract deployed to address:", loveAddress)

    await zoo.setLoveToken(loveAddress).then(() => console.log("Set love token in ZOO contract"))
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });