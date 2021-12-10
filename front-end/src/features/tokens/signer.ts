import {ethers} from 'ethers'
import {MintRequest} from "../../app/types";
import {contract} from "../../chain/contract";
import {abi} from "../../chain/abi";

// Address -> 0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199
const TEST_PRIVATE_KEY = "0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e"

const { ethereum } = (window as any);

export const getSigner = () => {
  let provider = new ethers.providers.Web3Provider(ethereum, "any");
  return provider.getSigner(0);
}

export const generateSignedAddress = async () => {
  const wallet = getSigner()
  const address: string = await wallet.getAddress()

  const signature: string = await wallet.signMessage(address);

  return {
    "address": address,
    "signature": signature,
  }
}

export const generateWalletRegistration = async (email: string, discord: string, twitter: string) => {
  const wallet = getSigner()
  const address: string = await wallet.getAddress()

  const walletRegistrationObject: object = {
    "address": address,
    "email": email,
    "discord": discord,
    "twitter": twitter,
  }

  const walletRegistrationObjectString: string = JSON.stringify(walletRegistrationObject);
  const signature: string = await wallet.signMessage(walletRegistrationObjectString);

  return {
    "wallet": walletRegistrationObject,
    "signature": signature,
  }
}

export const generateMintRequest = async (quantity: number) => {
  const wallet = getSigner();
  const address: string = await wallet.getAddress()

  const mintRequest: object = {
    'address': address,
    'quantity': quantity,
  }

  const mintRequestString: string = JSON.stringify(mintRequest);
  const signature:string = await wallet.signMessage(mintRequestString);

  return {
    "mint_request": mintRequest,
    "signature": signature,
  }
}

export const generateAction = async (tokenId: number, type: string) => {
  const wallet = getSigner()

  const action = {
    'id': tokenId,
    'type': type,
  }

  const actionString = JSON.stringify(action);
  const signature = await wallet.signMessage(actionString);

  return {
    "action": action,
    "signature": signature,
  }
}

export const mint = async(mintRequest: MintRequest): Promise<boolean> => {
  console.log("In signer")
  const signer = await getSigner()
  const zoo = new ethers.Contract(contract, abi, signer)

  let zooPrice = ethers.utils.formatEther(await zoo.ZOO_PRICE());

  const { address, quantity, nonce, hash, signature } = mintRequest;

  try {
    await zoo.buy(hash, signature, quantity, nonce, {
      value: ethers.utils.parseEther(zooPrice).mul(quantity)
    })
  } catch (e) {
    console.log(e)
    return false
  }

  console.log("Successfully minted")
  return true
}