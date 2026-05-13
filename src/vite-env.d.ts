/// <reference types="vite/client" />

// @tabler/icons-react ships types but Bundler resolution doesn't pick them up — re-declare.
declare module "@tabler/icons-react" {
  import * as TablerIcons from "@tabler/icons-react/dist/tabler-icons-react"
  export = TablerIcons
  export as namespace TablerIcons
}

declare const __APP_VERSION__: string
declare const __BUILD_TIME__: string

interface ImportMetaEnv {
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
  readonly BASE_URL: string
  readonly SSR: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
}
