import { lazy } from 'react'

// The editor and its grammars are most of the app's code, so they load the first time an editor shows.
export const CodeMirrorView = lazy(
    () => import('@/components/ui/CodeEditor/components/CodeMirrorView'),
)
