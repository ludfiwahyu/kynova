import { createContext } from 'react'

import type { VariableContextValue } from '@/components/ui/VariableInput/types'

/**
 * What a page tells its variable fields (the URL, params, headers, auth): which
 * variables there are and how to change one. Without it, a field still suggests
 * the variables it was given, without saying where they come from.
 */
export const VariableContext = createContext<VariableContextValue | null>(null)
