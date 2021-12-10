import React, {useEffect} from "react";
import {ethers} from "ethers";

import styles from "./styles/Header.module.css";
import utilities from "./styles/Utilities.module.css"
import logo from './images/logo.png'

import {Link, useLocation} from "react-router-dom";
import {classNames} from '../app/utils'

import {useAppDispatch, useAppSelector} from "../app/hooks";
import {selectWalletConnected, setWalletAddress, setWalletConnected} from "../features/tokens/tokenSlice";

export const Header = () => {

  // Used to display active header section
  const location = useLocation()

  const dispatch = useAppDispatch()
  // This is so we can determine if the user has connected their MetaMask wallet
  const walletConnected = useAppSelector(selectWalletConnected)

  // Get the MetaMask provider
  let provider: any
  const { ethereum } = (window as any);
  try {
    provider = new ethers.providers.Web3Provider(ethereum, "any");
  } catch (error) {
    provider = null
  }

  // Needed for initial load of wallet connection status
  const isConnected = async () => {
    if (provider !== null) {
      const accounts = await provider.listAccounts();
      if (accounts.length > 0) {
        dispatch(setWalletConnected(true))
        dispatch(setWalletAddress(accounts[0]))
      } else {
        dispatch(setWalletConnected(accounts.length > 0))
        dispatch(setWalletAddress(null))
      }
      return accounts.length > 0
    }
  }

  const connect = async () => {
    // Prompt user for account connections
    if (provider !== null) {
      await provider.send("eth_requestAccounts", []);
    }
  }

  // Watch for events so we can correctly update 'connected' state if user disconnects their wallet
  if (provider !== null) {
    ethereum.on('accountsChanged', (accounts: Array<string>) => {
      // If user has locked/logout from MetaMask, this resets the accounts array to empty
      if (!accounts.length) {
        dispatch(setWalletConnected(false))
      } else {
        dispatch(setWalletConnected(true))
      }
    });
  }

  useEffect(() => {
    isConnected();
  });

  return (
    <div className={styles.HeaderBase}>
      <div className={styles.HeaderContainer}>
        <div className={styles.HeaderContentBox}>
          <div className={styles.HeaderLogo}>
            <div>
              <Link to={"/"}>
                <span className={utilities.ScreenReaderOnly}>Doggo Cards</span>
                <img className={styles.HeaderLogoImage} src={logo} alt="Doggo Cards Logo" />
              </Link>
            </div>
            <div className={styles.HeaderLogoTextDiv}>
              <span>Zoobreak Test Server</span>
            </div>
          </div>
          <nav className={styles.HeaderNav}>
            <a href={"/mint"} className={classNames(location.pathname === "/mint" ? styles.Active : "", styles.Link)}>Mint</a>
            <a href={"/my-tower"} className={classNames(location.pathname === "/my-tower" ? styles.Active : "", styles.Link)} >My Tower</a>
            <a href={"/how-it-works"} className={classNames(location.pathname === "/how-it-works" ? styles.Active : "", styles.Link)} >How it Works</a>
          </nav>
          {(provider !== null) ? walletConnected ?
            <div className={styles.StatusIndicator}>
                <div className={styles.PingText}>Connected</div>
                <span className={styles.PingContainer} >
                  <span className={styles.Ping}></span>
                  <span className={styles.PingSpan}></span>
                </span>
            </div> :
            <div className={styles.StatusIndicator}>
              <div className={styles.WalletActivate} onClick={() => {
                connect()
              }}>
                Connect Wallet
              </div>
              <span className={styles.PingContainer} >
                  <span className={styles.PingAlternate}></span>
                  <span className={styles.PingSpanAlternate}></span>
                </span>
            </div> : <></>
          }
        </div>
      </div>
    </div>
  )
}