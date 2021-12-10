import {Token, Step, MintRequest} from "../../app/types";
import {getAPIEndpoint} from "./constants";
import {generateAction, generateMintRequest, generateSignedAddress, generateWalletRegistration, mint} from "./signer";
import {printMessageTrace} from "hardhat/internal/hardhat-network/stack-traces/debug";


// Ping
export const ping = () => {
  let endpoint: string  = getAPIEndpoint("/ping/")

  return new Promise<string>((resolve) => {
    fetch(endpoint)
      .then(response => response.json())
      .then(json => {
        console.log("json", json)
        resolve(json.body)
      })
  })
}

// Register
export const registerWallet = async (email: string, discord: string, twitter: string) => {
  const endpoint: string  = getAPIEndpoint("/wallet/register/")
  const registrationBody = await generateWalletRegistration(email, discord, twitter)

  return new Promise<object>((resolve) => {
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrationBody)
    })
      .then(response => {
        resolve(response)
      })
      .catch(error => {
        console.log(error)
      })
  })
}

// Get Wallet Infox
export const fetchWallet = async () => {
  const endpoint: string = getAPIEndpoint("/wallet/")
  const walletBody = await generateSignedAddress()

  return new Promise<object>((resolve) => {
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(walletBody)
    })
      .then(response => {
        resolve(response)
      })
      .catch(error => {
        console.log(error)
      })
  })
}

export const mintRequest = async (quantity: number) => {
  const endpoint: string = getAPIEndpoint("/mint_request/")
  const mintRequestBody = await generateMintRequest(quantity)

  return new Promise<object>((resolve) => {
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mintRequestBody)
    })
      .then(response => {
        resolve(response)
      })
      .catch(error => {
        console.log(error)
      })
  })
}

export const mintWrapper = async (mintRequest: MintRequest): Promise<boolean> => {
  console.log("In Wrapper")
  return await mint(mintRequest)
}

export const sendAction = async (tokenId: number, type: string) => {
  const endpoint: string = getAPIEndpoint("/action/")
  const sendActionBody = await generateAction(tokenId, type)

  return new Promise<object>((resolve) => {
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sendActionBody)
    })
      .then(response => {
        if (!response.ok) {
          return response.text().then(text => text)
        }
        return response.json()
      })
      .then(json => {
        console.log(json)
        resolve(json);
      })
      .catch(error => {
        console.log(error)
      })
  })
}

// Get list of tokens
export const fetchTokens = async (): Promise<object> => {
  const endpoint: string = getAPIEndpoint("/wallet/tokens/")
  const walletBody = await generateSignedAddress()

  return new Promise<object>((resolve) => {
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(walletBody)
    })
      .then(response => {
        resolve(response)
      })
      .catch(error => {
        console.log(error)
      })
  })
}