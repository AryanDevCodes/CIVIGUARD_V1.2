
import { Route } from "react-router-dom";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import NotFound from "@/pages/NotFound";
import HomeRouter from "@/components/routing/HomeRouter";

export const publicRoutes = [
  <Route key="login" path="/login" element={<Login />} />,
  <Route key="signup" path="/signup" element={<Signup />} />,
  <Route key="home" path="/" element={<HomeRouter />} />,
  <Route key="not-found" path="*" element={<NotFound />} />
];
