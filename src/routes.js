import Revenue from "layouts/revenue";
import Whiteboard from "layouts/whiteboard";
import Team from "layouts/team";
import Settings from "layouts/settings";
import SignIn from "layouts/authentication/sign-in";

import { IoWallet, IoGrid, IoPeopleOutline, IoSettings } from "react-icons/io5";
import { IoIosDocument } from "react-icons/io";

const routes = [
  {
    type: "collapse",
    name: "Revenue",
    key: "revenue",
    route: "/revenue",
    icon: <IoWallet size="15px" color="inherit" />,
    component: Revenue,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Whiteboard",
    key: "whiteboard",
    route: "/whiteboard",
    icon: <IoGrid size="15px" color="inherit" />,
    component: Whiteboard,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Team",
    key: "team",
    route: "/team",
    icon: <IoPeopleOutline size="15px" color="inherit" />,
    component: Team,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Settings",
    key: "settings",
    route: "/settings",
    icon: <IoSettings size="15px" color="inherit" />,
    component: Settings,
    noCollapse: true,
  },
  { type: "divider", key: "divider-auth" },
  {
    type: "collapse",
    name: "Sign In",
    key: "sign-in",
    route: "/authentication/sign-in",
    icon: <IoIosDocument size="15px" color="inherit" />,
    component: SignIn,
    noCollapse: true,
  },
];

export default routes;
