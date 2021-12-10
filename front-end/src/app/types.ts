export type StyleProps = {
  style: string
}

export enum Step {
  REGISTER = "register",
  PRESIGN = "pre-sign",
  MINT = "mint",
}

export type Token = {
  token_id: number;
  name: string;
  is_alive: boolean;
  hunger: string;
  fed_until: string;
  sleep: string;
  rested_until: string;
  is_sleeping: boolean;
  sleeping_until: string;
  love: number;
  message: string;
  token_uri: string;
}

// Sent to the server
export type RegistrationRequestObject = {
  email: string,
  discord: string,
  twitter: string,
}

// Sent to the server
export type PresignRequestObject = {
  quantity: number
}

export type MintRequest = {
  address: string,
  quantity: number,
  nonce: string,
  hash: string,
  signature: string,
}
