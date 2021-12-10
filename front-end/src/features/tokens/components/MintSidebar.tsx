import React, {useState} from "react";
import styles from './styles/Sidebar.module.css';
import {Step, StyleProps} from "../../../app/types";
import {classNames} from "../../../app/utils";
import {useAppSelector} from "../../../app/hooks";
import {selectStep} from "../tokenSlice";

export const MintSidebar = (props: StyleProps) => {
  const currentStep = useAppSelector(selectStep)

  return (
      <div className={props.style}>
        <div className={styles.StickyContainer}>
          <div className={styles.TitleText}>
              Mint
          </div>
          <div className={styles.FilterDiv}>
            <div className={classNames(currentStep === Step.REGISTER ? styles.Active : "", styles.FilterItem)}>
              <div className={styles.FilterItemSpan}>
                <span>1. Register</span>
              </div>
            </div>
            <div className={classNames(currentStep === Step.PRESIGN ? styles.Active : "", styles.FilterItem)}>
              <div className={styles.FilterItemSpan}>
                <span>2. Pre-Sign</span>
              </div>
            </div>
            <div className={classNames(currentStep === Step.MINT ? styles.Active : "", styles.FilterItem)}>
              <div className={styles.FilterItemSpan}>
                <span>3. Mint</span>
              </div>
            </div>
          </div>
        </div>
    </div>
  )
}

