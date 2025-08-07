
import { publicRoutes } from "./publicRoutes";
import { citizenRoutes } from "./citizenRoutes";
import { officerRoutes } from "./officerRoutes";
import { adminRoutes } from "./adminRoutes";

export const allRoutes = [
  ...publicRoutes,
  ...citizenRoutes,
  ...officerRoutes,
  ...adminRoutes,
];
