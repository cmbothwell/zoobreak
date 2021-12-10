import React, {useEffect, useState} from 'react';

import styles from './styles/Mint.module.css';

import {useAppDispatch, useAppSelector} from '../../../app/hooks';
import {Step, StyleProps} from "../../../app/types";

import {
  getWallet,
  mint,
  presignMintRequest,
  register,
  selectError, selectMintRequest,
  selectReady,
  selectResponse,
  selectStep,
  selectWalletAddress, selectWalletConnected, setReady, setResponse,
  setStep
} from '../tokenSlice';

import {classNames} from "../../../app/utils";
import {InfoText} from "./elements/InfoText";


export const Mint = (props: StyleProps) => {
  const dispatch = useAppDispatch();
  const currentStep = useAppSelector(selectStep)

  const isConnected = useAppSelector(selectWalletConnected)
  const address = useAppSelector(selectWalletAddress)
  const addressDisplay = address != null ? address : "Connect your wallet to populate this field"

  const [email, setEmail] = useState<string>("corey@avim.io")
  const [discord, setDiscord] = useState<string>("corey#3333")
  const [twitter, setTwitter] = useState<string>("@corey")

  const [quantity, setQuantity] = useState<number>(1)

  const response = useAppSelector(selectResponse)
  const isError = useAppSelector(selectError)
  const isReady = useAppSelector(selectReady)
  const mintRequest = useAppSelector(selectMintRequest)

  const registrationObject = {
    email: email,
    discord: discord,
    twitter: twitter,
  }

  const quantityObject = {
    quantity: quantity
  }

  useEffect(() => {
    dispatch(setResponse({}))
    dispatch(setReady(false))
  }, [currentStep])

  return (
    <div className={props.style}>
      <div className={styles.Text}>
        <InfoText step={currentStep} />
      </div>
      <div className={styles.LeftContent}>
        {currentStep == Step.REGISTER &&
            <>
                <div className={styles.InputGroup}>
                  <div className={styles.InputWrapper}>
                      <label className={styles.Label}>Address</label>
                      <input type="text"
                             name="address"
                             id="address"
                             placeholder="example@example.com"
                             className={styles.Input}
                             value={addressDisplay}
                             disabled />
                  </div>
                  <div className={styles.InputWrapper}>
                      <label className={styles.Label}>Email</label>
                      <input type="text"
                             name="email"
                             id="email"
                             placeholder="example@example.com"
                             className={styles.Input}
                             value={email}
                             onChange={(e) => {
                               setEmail(e.target.value)
                             }}
                             disabled={isReady}/>
                  </div>
                  <div className={styles.InputWrapper}>
                      <label className={styles.Label}>Discord</label>
                      <input type="text"
                             name="discord"
                             id="discord"
                             placeholder="Username#0000"
                             className={styles.Input}
                             value={discord}
                             onChange={(e) => {
                               setDiscord(e.target.value)
                             }}
                             disabled={isReady}/>
                  </div>
                  <div className={styles.InputWrapper}>
                      <label className={styles.Label}>Twitter</label>
                      <input type="text"
                             name="twitter"
                             id="twitter"
                             placeholder="@twitter_name"
                             className={styles.Input}
                             value={twitter}
                             onChange={(e) => {
                               setTwitter(e.target.value)
                             }}
                             disabled={isReady}/>
                  </div>
                </div>
                {isReady ?
                  <div className={styles.ButtonDiv}>
                    <button className={styles.Button} onClick={() => dispatch(setStep(Step.PRESIGN))}>
                      Go to Next Step
                    </button>
                  </div> :
                  <div className={styles.ButtonDiv}>
                    <button className={styles.Button} onClick={() => dispatch(getWallet(null))}>
                      I already Registered
                    </button>
                    <button className={styles.ButtonRight} onClick={() => dispatch(register(registrationObject))}>
                      Register
                    </button>
                  </div>
                }
            </>
        }
        {currentStep == Step.PRESIGN &&
            <>
                <div className={styles.InputGroup}>
                    <div className={styles.InputWrapper}>
                        <label className={styles.Label}>Address</label>
                        <input type="text"
                               name="address"
                               id="address"
                               placeholder="example@example.com"
                               className={styles.Input}
                               value={addressDisplay}
                               disabled />
                    </div>
                    <div className={styles.InputWrapper}>
                        <label className={styles.Label}>Mint Quantity</label>
                        <input type="number"
                               name="quantity"
                               id="quantity"
                               className={styles.Input}
                               value={quantity}
                               onChange={(e) => {
                                 setQuantity(parseInt(e.target.value))
                               }}
                               disabled={true} />
                    </div>
                </div>
              {isReady ?
                <div className={styles.ButtonDiv}>
                  <button className={styles.Button} onClick={() => dispatch(setStep(Step.MINT))}>
                    Go to Next Step
                  </button>
                </div> :
                <div className={styles.ButtonDiv}>
                  <button className={styles.Button} onClick={() => dispatch(presignMintRequest(quantityObject))}>
                    Get your Mint Request
                  </button>
                </div>
              }
            </>
        }
        {currentStep == Step.MINT &&
            <>
                <div className={styles.InputGroup}>
                    <div className={styles.InputWrapper}>
                        <label className={styles.Label}>Address</label>
                        <input type="text"
                               name="address"
                               id="address"
                               placeholder="example@example.com"
                               className={styles.Input}
                               value={addressDisplay}
                               disabled />
                    </div>
                </div>
              {isReady ?
                <div className={styles.ButtonDiv}>
                  <button className={styles.Button} onClick={() => dispatch(setStep(Step.MINT))}>
                    Go to Next Step
                  </button>
                </div> :
                <div className={styles.ButtonDiv}>
                  <button className={styles.Button} onClick={() => dispatch(mint(mintRequest))}>
                    Mint
                  </button>
                </div>
              }
            </>
        }
      </div>
      <div className={styles.RightContent}>
        <div className={styles.TextAreaLabel}>Response</div>
        <div className={styles.Response}>
          <pre className={classNames(isError ? styles.Error : "", styles.Pre)}>
            {response}
          </pre>
        </div>
      </div>
    </div>
  );
}
