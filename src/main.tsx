import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { CALLBACK_PATH, startDesktopChrome } from '@/utils'

import { App } from './App'

import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import './assets/styles/tailwind.css'
import './assets/styles/tokens.css'
import './assets/styles/base.css'
import './assets/styles/auth.css'
import './assets/styles/shell.css'
import './assets/styles/sidebar.css'
import './assets/styles/workbench.css'
import './assets/styles/collaboration.css'
import './assets/styles/settings.css'

// The OAuth 2.0 authorization window lands here; the window that opened it reads the URL and closes it.
const isOAuthCallback = location.pathname === CALLBACK_PATH

startDesktopChrome()

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        {isOAuthCallback ? (
            <p className="oauth-callback">Authorization finished. You can close this window.</p>
        ) : (
            <App />
        )}
    </StrictMode>,
)
