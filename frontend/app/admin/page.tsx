import type { Metadata } from "next";

import PanelClient from "./panel-client";

export const metadata: Metadata = {
  title: "Panel de administración",
};

export default function PaginaPanelAdministracion() {
  return <PanelClient />;
}