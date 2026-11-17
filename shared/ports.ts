export const POSTGRES_PORT = 5432

export const SUPABASE_POOLER_PORT = 6543

/** PORT when .env.local leaves it out. */
export const DEFAULT_PORT = 8787

/** With `npm run dev` the page (Vite) takes PORT and the API server the port after it. */
export const devApiPort = (port: number) => port + 1
