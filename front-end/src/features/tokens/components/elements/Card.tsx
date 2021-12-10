import React, {useEffect, useState} from "react"
import styles from "../styles/Card.module.css";

import {useAppSelector} from "../../../../app/hooks";
import {selectWalletConnected} from "../../tokenSlice";

import {ReactComponent as Coin} from '../images/coin.svg';
import {Token} from "../../../../app/types";

type TokenCardProps = {
  key: string
  token: Token
}

export const Card = (props: TokenCardProps) => {
  const walletConnected = useAppSelector(selectWalletConnected)
  const [imageURL, setImageURL] = useState<string>("")

  useEffect(() => {
    const fetchImage = async () => {
      fetch(props.token.token_uri, {
        method: 'GET',
      })
        .then(response => response.json())
        .then(json => setImageURL(json))
        .catch(error => {
          console.log(error)
        })
    }

    fetchImage()
  })

  return (
    <li key={props.key} className={styles.CardExterior}>
      <img className={styles.CardImage} src={imageURL} alt={`Token ${props.token.name}`}  />
      <div className={styles.CardInterior}>
        <div className={styles.CardName}>{props.token.name}</div>
        <div className={styles.CardSub}>
          <div className={styles.CardAttribute}>Love: {props.token.love}</div>
          <div className={styles.RightAlign}>
          </div>
        </div>
      </div>
    </li>
  )
};