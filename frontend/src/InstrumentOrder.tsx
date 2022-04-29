import { makeStyles } from "@material-ui/core/styles";
import { tabUnstyledClasses } from "@mui/base/TabUnstyled";
import Box from "@mui/material/Box";
import TabUnstyled from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { styled } from "@mui/system";
import React, { useContext, useEffect, useState } from "react";
import {
  Switch,
  Route,
  useRouteMatch,
  useHistory,
  useLocation,
} from "react-router-dom";

import ReturnButton from './components/ReturnButton';
import InstrumentBuy from "./InstrumentBuy";
import InstrumentSell from "./InstrumentSell";
import theme from "./theme";
import { TradeContext } from "./TradeContext";
import { loadSynthPrice } from "./util/interact";

// Apart from `useStyles`, this shows an example of using styled for custom component, which
// can be more flexible.
const Tab = styled(TabUnstyled)`
  color: white;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: bold;
  background-color: transparent;
  width: 100%;
  padding: 12px 16px;
  margin: 6px 6px;
  border: none;
  border-radius: 5px;
  display: flex;
  justify-content: center;
  &.${tabUnstyledClasses.selected} {
    background-color: white;
    color: black;
  }
`;

const useStyles = makeStyles({
  currentTicker: {
    color: theme.activeTextColor,
    fontSize: "32pt",
  },
});

const TRADE_URL = "/trade";
const BASE_URL = `${TRADE_URL}/order`;
const BUY_URL = `${BASE_URL}/buy`;
const SELL_URL = `${BASE_URL}/sell`;

// Rendered in `/trade/order` and has 2 sub pages, one for buy and another for sell.
// The instrument of this order is in the URL search param `ticker=`
export default function InstrumentOrder(): React.ReactElement {
  const match = useRouteMatch([BUY_URL, SELL_URL]);
  const location = useLocation();
  const history = useHistory();
  const ticker = new URLSearchParams(location.search).get("ticker");
  const styles = useStyles();
  const [synthPrice, setSynthPrice] = useState(0);

  const MINUTE_MS = 600000;

  useEffect(() => {
    // Expect a ticker in the URL like "/trade/order/buy?ticker=NFT"
    // If no ticker found, route back to the "/trade"
    if (ticker == null) {
      history.push(TRADE_URL);
    }
    const interval = setInterval(async () => {
      const synthPrice = await loadSynthPrice("SynthTest1");
      setSynthPrice(synthPrice);
    }, MINUTE_MS);

    return () => clearInterval(interval);
  }, [ticker, history]);

  const { tradeData } = useContext(TradeContext);

  // We might need to change this when we have tons of instruments.
  // We might also want to better handle not found due to instruments loading or
  // not found due to the ticker does not exist.
  const instrument = tradeData?.instruments.find(
    (instrument) => instrument.ticker === ticker,
  );
  if (tradeData == null || instrument == null) {
    return <div />;
  }
  const onSwitch = (targetURL: string) => {
    if (targetURL === match?.url) {
      return;
    }
    // switch to buy or sell tab. `location.search` is needed to keep the URL params.
    history.push(`${targetURL}${location.search}`);
  };

  return (
    <>
      <ReturnButton onClick={() => history.push('/trade')} textValue="Back" />
      <Box
        sx={{
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        {/* Since there are only 2 tabs, just hard code 0 or 1 as the selected tab */}
        <Tabs centered value={match?.url === BUY_URL ? 0 : 1}>
          <Tab label="Buy" onClick={() => onSwitch(BUY_URL)} />
          <Tab label="Sell" onClick={() => onSwitch(SELL_URL)} />
        </Tabs>
      </Box>
      <div
        style={{
          position: "relative",
          height: "max-content",
          paddingTop: "12px",
          overflow: "auto",
          maxWidth: "1144px",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <Switch>
          {/* Renders buy or sell based on URL */}
          <Route path="/trade/order/buy" exact>
            <InstrumentBuy instrument={instrument} />
          </Route>
          <Route path="/trade/order/sell" exact>
            <InstrumentSell instrument={instrument} />
          </Route>
        </Switch>
      </div>
    </>
  );
}
