/// <reference types="vite/client" />
// noinspection JSUnusedGlobalSymbols

import type { MessageApi } from "naive-ui";

declare global {
  interface Window {
    $message: MessageApi;
    $accessToken: string | null | undefined;
  }
}

