/* eslint-disable */
// @ts-nocheck
import { defaultCache } from "@serwist/next/worker";

declare const self: any;

// @ts-ignore
import { Serwist } from "serwist";

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
