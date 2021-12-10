import React, {useEffect} from "react";
import styles from './styles/Tower.module.css';

import {Card} from "./elements/Card";
import {Token, StyleProps} from "../../../app/types";
import {useAppDispatch, useAppSelector} from "../../../app/hooks";
import {getTokens, selectTokens} from "../tokenSlice";

export const Tower = (props: StyleProps) => {
  const dispatch = useAppDispatch()
  const tokens = useAppSelector(selectTokens)

  useEffect(() => {
    dispatch(getTokens(null))
  }, [])

  return (
    <div className={props.style}>
      {
        tokens.length !== 0 ?
        tokens.map((token: Token, index: number) => {
          return <Card key={index.toString()} token={token} />
        }) : <div className={styles.EmptyText}>
              It seems like you don't have any OG's in your portfolio. Head on over to the <a href={"/mint"} className={styles.EmptyTextLink}>mint page</a> to mint some :)
             </div>
      }
    </div>
  );
}
