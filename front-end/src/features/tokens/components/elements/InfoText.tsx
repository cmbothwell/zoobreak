import {Step} from "../../../../app/types";
import {Link, useLocation} from "react-router-dom";

import styles from '../styles/Mint.module.css';

export type InfoTextProps = {
  step: Step
}

export const InfoText = (props: InfoTextProps) => {
  return (
    <>
      {
        props.step === Step.REGISTER &&
        <div>
            This is an interactive example demonstrating the concept of off-chain signing.
            The first step is to "register" your wallet. If you already registered, click "I already Registered".
        </div>
      }
      {
        props.step === Step.PRESIGN &&
          <div>
              Now we will send a minting request to the server. The server will pre-sign the request and return
              a few parameters which you will see in the response pane.
          </div>
      }
      {
        props.step === Step.MINT &&
          <div>
              Finally, we send the pre-signed mint request to the blockchain and receive our tokens. Please make sure you are on the Rinkeby network.
              Once you see that the transaction has completed in Metamask, head on over to <Link to={"/my-tower"} className={styles.TextLink}>My Tower</Link>.
          </div>
      }
    </>
  )
}