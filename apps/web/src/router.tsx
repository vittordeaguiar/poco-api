import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./ui/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { HousesPage } from "./pages/HousesPage";
import { HouseDetailPage } from "./pages/HouseDetailPage";
import { LatePage } from "./pages/LatePage";
import { WellPage } from "./pages/WellPage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PendingPage } from "./pages/PendingPage";
import { redirectIfAuthenticated, requireAuth } from "./lib/auth";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
    loader: redirectIfAuthenticated
  },
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <NotFoundPage />,
    loader: requireAuth,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "houses", element: <HousesPage /> },
      { path: "houses/:id", element: <HouseDetailPage /> },
      { path: "pending", element: <PendingPage /> },
      { path: "late", element: <LatePage /> },
      { path: "well", element: <WellPage /> }
    ]
  }
]);
