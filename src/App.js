import { useState, useEffect, useMemo } from "react";
import { Route, Switch, Redirect, useLocation } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import Sidenav from "examples/Sidenav";
import theme from "assets/theme";
import themeRTL from "assets/theme/theme-rtl";
import rtlPlugin from "stylis-plugin-rtl";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import routes from "routes";
import { useVisionUIController, setMiniSidenav } from "context";
import { useAuth } from "context/AuthContext";

const PUBLIC_ROUTES = ["/authentication/sign-in"];

function LoadingScreen() {
  return (
    <VuiBox display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <VuiTypography color="white">Loading...</VuiTypography>
    </VuiBox>
  );
}

function ProtectedRoute({ component: Component, ...rest }) {
  const { session, loading } = useAuth();
  return (
    <Route
      {...rest}
      render={(props) => {
        if (loading) return <LoadingScreen />;
        if (!session) return <Redirect to="/authentication/sign-in" />;
        return <Component {...props} />;
      }}
    />
  );
}

function RootRedirect() {
  const { session, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return <Redirect to={session ? "/revenue" : "/authentication/sign-in"} />;
}

export default function App() {
  const [controller, dispatch] = useVisionUIController();
  const { miniSidenav, direction, layout, sidenavColor } = controller;
  const [onMouseEnter, setOnMouseEnter] = useState(false);
  const rtlCache = useMemo(
    () =>
      createCache({
        key: "rtl",
        stylisPlugins: [rtlPlugin],
      }),
    []
  );
  const { pathname } = useLocation();
  const { session } = useAuth();

  const handleOnMouseEnter = () => {
    if (miniSidenav && !onMouseEnter) {
      setMiniSidenav(dispatch, false);
      setOnMouseEnter(true);
    }
  };

  const handleOnMouseLeave = () => {
    if (onMouseEnter) {
      setMiniSidenav(dispatch, true);
      setOnMouseEnter(false);
    }
  };

  useEffect(() => {
    document.body.setAttribute("dir", direction);
  }, [direction]);

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  const dashboardRoutes = routes.filter((r) => r.route && !PUBLIC_ROUTES.includes(r.route));

  const getRoutes = (allRoutes) =>
    allRoutes.map((route) => {
      if (route.collapse) return getRoutes(route.collapse);
      if (!route.route) return null;
      if (PUBLIC_ROUTES.includes(route.route)) {
        return <Route exact path={route.route} component={route.component} key={route.key} />;
      }
      return <ProtectedRoute exact path={route.route} component={route.component} key={route.key} />;
    });

  const showDashboardChrome = layout === "dashboard" && session && !PUBLIC_ROUTES.includes(pathname);

  const content = (
    <>
      {showDashboardChrome && (
        <Sidenav
          color={sidenavColor}
          brand=""
          brandName="DROPSHIP OPS"
          routes={dashboardRoutes}
          onMouseEnter={handleOnMouseEnter}
          onMouseLeave={handleOnMouseLeave}
        />
      )}
      <Switch>
        {getRoutes(routes)}
        <Route exact path="/" component={RootRedirect} />
        <Route path="*" component={RootRedirect} />
      </Switch>
    </>
  );

  return direction === "rtl" ? (
    <CacheProvider value={rtlCache}>
      <ThemeProvider theme={themeRTL}>
        <CssBaseline />
        {content}
      </ThemeProvider>
    </CacheProvider>
  ) : (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {content}
    </ThemeProvider>
  );
}
