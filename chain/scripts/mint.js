const { getMintRequest } = require("../utils/mockSigner")
const {ethers} = require("hardhat");

const { LOCAL_CONTRACT_ADDRESS, CONTRACT_ADDRESS, PRIVATE_KEY  } = process.env;

async function mint() {
  [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

  // Attach contract object
  let ZOO = await ethers.getContractFactory("ZOO");
  let zoo = await ZOO.attach(LOCAL_CONTRACT_ADDRESS);

  // Toggle sale
  let saleLive = await zoo.saleLive()
  if (!saleLive) {
    console.log("Toggled Sale")
    await zoo.toggleSaleStatus()
  }

  let address = await owner.getAddress()
  let purchaseAmount = 1

  // let rinkebyWallet = new ethers.Wallet(PRIVATE_KEY)
  // const zoo = new ethers.Contract(contract, abi, signer)
  //
  // let address = await rinkebyWallet.getAddress()
  // let purchaseAmount = 1

  const { sender, quantity, nonce, hash, signature } = await getMintRequest(address, purchaseAmount);

  // const hash = "0x8751cd9f090da7edc95ea396810fc00119845e78971a08416640750c74aac7d5"
  // const signature = "0xc790384516facd093f664638d41ef9326ba1c5840acd9d67f05ddab618dbf8c835a4707c72361626578a8d78f788991123e72a5cecf701f3a786dd84e44a51281b"
  // const quantity = 1
  // const nonce = "Ro8FmIHnLgXj28ffi3VEl9LhzYqRMx9l"

  let zooPrice = ethers.utils.formatEther(await zoo.ZOO_PRICE());

  await zoo.buy(hash, signature, quantity, nonce, {
    value: ethers.utils.parseEther(zooPrice),
    gasPrice: ethers.utils.parseUnits('100', 'gwei'),
    gasLimit: 1000000
  })

  // await userZoo.buy(hash, signature, quantity, nonce, {
  //   value: ethers.utils.parseEther(zooPrice)
  // })

  const numMinted = await zoo.publicAmountMinted().then(res => res.toNumber())

  console.log("Successfully minted", zooPrice)
  console.log("Number minted so far:", numMinted);
  console.log("Owner", await zoo.ownerOf(numMinted));
}

mint();