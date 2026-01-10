/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WS_BASE_URL: string;
  readonly VITE_DEFAULT_ROOM_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
