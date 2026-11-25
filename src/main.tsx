import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import "./styles.css";

const base = import.meta.env.BASE_URL;

const router = createRouter({
  routeTree,
  // En GitHub Pages la app vive en /<repo>/, así que el router necesita ese prefijo.
  basepath: base === "/" ? "/" : base.replace(/\/$/, ""),
  scrollRestoration: true,
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
