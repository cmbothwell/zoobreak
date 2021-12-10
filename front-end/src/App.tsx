import React from 'react';
import {Redirect, Route, Switch} from "react-router-dom";

import styles from './App.module.css';

import {Mint} from "./features/tokens/components/Mint";
import {Tower} from "./features/tokens/components/Tower";
import {Header} from "./components/Header";
import {MintSidebar} from "./features/tokens/components/MintSidebar";
import {Footer} from "./components/Footer";
import {TowerSidebar} from "./features/tokens/components/TowerSidebar";
import {HowItWorks} from "./features/tokens/components/HowItWorks";
import {HowItWorksSidebar} from "./features/tokens/components/HowItWorksSidebar";

function App() {
  return (
    <div className={styles.App}>
      <Header />
      <div className={styles.Container}>
        <Switch>
          <Route exact path="/">
            <Redirect to="/mint" />
          </Route>
          <Route exact path="/mint">
            <div className={styles.Grid}>
              <MintSidebar style={styles.SidebarContainer} />
              <Mint style={styles.ContentContainer} />
            </div>
          </Route>
          <Route path="/my-tower">
            <div className={styles.Grid}>
              <TowerSidebar style={styles.SidebarContainer} />
              <Tower style={styles.ContentContainer} />
            </div>
          </Route>
          <Route path="/how-it-works">
            <div className={styles.Grid}>
              <HowItWorksSidebar style={styles.SidebarContainer} />
              <HowItWorks style={styles.ContentContainer} />
            </div>
          </Route>
        </Switch>
      </div>
      <Footer />
    </div>
  );
}

export default App;
