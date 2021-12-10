import React from "react";
import styles from './styles/Sidebar.module.css';

import {StyleProps} from "../../../app/types";
import {classNames} from "../../../app/utils";

export const TowerSidebar = (props: StyleProps) => {
  return (
    <div className={props.style}>
      <div className={classNames(styles.BackLinkDiv, styles.Absolute)}>
        <a className={styles.BackLink} href={"/mint"}>&#8592; Back to minting page</a>
      </div>
      <div className={styles.StickyContainer}>
        <div className={styles.TitleText}>
          My Tower
        </div>
      </div>
    </div>
  )
}

