import React from "react";
import {StyleProps} from "../../../app/types";

import styles from './styles/HowItWorks.module.css';
import {ReactComponent as Coin} from './images/coin.svg';
import {ExclamationIcon} from "@heroicons/react/solid";

import {Link, useLocation} from "react-router-dom";

export const HowItWorks = (props: StyleProps) => {
  return (
    <div className={props.style}>
      <div className={styles.Prose}>
        <h2>Help the animals break out of the zoo!</h2>
        <p>
          This interactive example was part of our project at the University of Zurich
          and demonstrates the power of off-chain signing when combined with NFT's.
          Head on over to the <Link to={"/mint"} className={styles.TextLink}>mint</Link> page to mint your own.
        </p>
        <p>
          The process explores the deployment of an NFT with an off-chain signing component.
          Off-chain signing allows for greater control by the token owner to control the mint process and mix in
          traditional server-side components into the blockchain experience.
        </p>
        <p>
          Before minting, users send a RESTful request to a backend API server with their mint details encoded as a JSON.
          Then, the server parses these details and encodes them, along with a random nonce, into a signable message in accordance with <a href={"https://eips.ethereum.org/EIPS/eip-191"} className={styles.TextLink}>EIP-191</a>. The API server then
          signs the message with it's own private signing key, and returns the client: a) the original message, b) a hash of the EIP-191 compliant message,
          c) the random 32 character string "nonce", and d) a signature produced from the private signing key.
        </p>
        <p>
          The client now submits the received hash, the signature, the original mint parameters, and the nonce to the smart contract's mint function.
          Inside the smart contract, the mint function checks the provided hash & signature, and by using elliptic-curve recovery
          (see <a href={"https://eips.ethereum.org/EIPS/eip-2098"} className={styles.TextLink}>EIP-2098</a> for a discussion),
          the contract can use the the passed message hash and signature to verify the original signer of the message, in this case, the API server.
        </p>
        <p>
          The contract also takes the mint parameters along with the random nonce and "re-hashes" them, verifying that the produced hash matches that which is passed from the client.
          This prevents separate wallets from sharing hashes with one another (the sender address is included in the parameters).
        </p>
        <p>
          Finally, the contract saves the used nonce in a mapping and prevents any further transaction from using said nonce,
          meaning that each mint authorization is a one-time use.
          In doing so, the contract prohibits mints that are not "pre-authorized" by the server. The applications of such an approach are numerous.
        </p>
      </div>
    </div>
  );
}
