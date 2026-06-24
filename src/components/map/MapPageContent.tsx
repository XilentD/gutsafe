"use client";

import { MapProvider } from "./MapProvider";
import { ToiletMap } from "./ToiletMap";

export function MapPageContent() {
  return (
    <MapProvider>
      <ToiletMap />
    </MapProvider>
  );
}
