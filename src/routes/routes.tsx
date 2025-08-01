import { createRoute } from "@tanstack/react-router";
import { RootRoute } from "./__root";
// import HomePage from "../pages/HomePage";
// import SecondPage from "@/pages/SecondPage";
import HostsManagePage from "@/pages/HostsManagePage";
import SystemHostsPage from "@/pages/SystemHostsPage";
import SettingsPage from "@/pages/SettingsPage";

// TODO: Steps to add a new route:
// 1. Create a new page component in the '../pages/' directory (e.g., NewPage.tsx)
// 2. Import the new page component at the top of this file
// 3. Define a new route for the page using createRoute()
// 4. Add the new route to the routeTree in RootRoute.addChildren([...])
// 5. Add a new Link in the navigation section of RootRoute if needed

// Example of adding a new route:
// 1. Create '../pages/NewPage.tsx'
// 2. Import: import NewPage from '../pages/NewPage';
// 3. Define route:
//    const NewRoute = createRoute({
//      getParentRoute: () => RootRoute,
//      path: '/new',
//      component: NewPage,
//    });
// 4. Add to routeTree: RootRoute.addChildren([HomeRoute, NewRoute, ...])
// 5. Add Link: <Link to="/new">New Page</Link>

export const HomeRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/",
  component: SystemHostsPage,
});

export const HostPageRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/hosts",
  component: HostsManagePage,
});
export const SystemHostsRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/system-hosts",
  component: SystemHostsPage,
});

const SettingsRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/settings",
  component: SettingsPage,
});

export const rootTree = RootRoute.addChildren([
  HomeRoute,
  // SecondPageRoute,
  HostPageRoute,
  SystemHostsRoute,
  SettingsRoute,
]);
