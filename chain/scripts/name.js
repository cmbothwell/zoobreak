async function name() {
    let ZOO = await ethers.getContractFactory("ZOO");
    let zoo = await ZOO.attach('0x5FbDB2315678afecb367f032d93F642f64180aa3');

    await zoo.changeName(1, "Alex").then(() => console.log("Name changed successfully"));
    console.log("Name of the first token:", await zoo.tokenNameByIndex(1).then(res => res));
}

name();