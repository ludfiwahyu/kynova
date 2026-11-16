import type { FormEvent } from 'react'
import { useId, useState } from 'react'

import { HINTS, LABELS, SIGN_IN_NOTE, SSL_OPTIONS } from '@/pages/database/logic/config'
import { hostOf } from '@/pages/database/logic/helpers'
import { toChoiceViews, toRecentRows } from '@/pages/database/logic/mappers'
import type {
    Busy,
    DatabaseChoice,
    DatabasePickerProps,
    DatabaseResult,
} from '@/pages/database/types'
import { api, type DatabaseInput } from '@/services'
import { forgetRecent, switchDatabase, useDatabase } from '@/stores'
import { inferSslMode, isSupabaseHost, type SslMode } from '#shared/databaseUrl.ts'

export function useDatabasePicker({ onSwitched }: DatabasePickerProps) {
    const current = useDatabase((state) => state.current)
    const recent = useDatabase((state) => state.recent)

    const [choice, setChoice] = useState<DatabaseChoice>(
        current?.kind === 'local' || !current ? 'local' : 'external',
    )
    const [url, setUrl] = useState('')
    const [ssl, setSsl] = useState<SslMode>('verify')
    const [sslChosen, setSslChosen] = useState(false)
    const [ca, setCa] = useState('')
    const [showUrl, setShowUrl] = useState(false)
    const [busy, setBusy] = useState<Busy>(null)
    const [result, setResult] = useState<DatabaseResult | null>(null)

    const urlId = useId()
    const hintId = useId()

    // View model

    const isSupabase = isSupabaseHost(hostOf(url))
    const isIdle = busy === null
    const canSubmit = url.trim() !== '' && isIdle
    const urlType = showUrl ? 'text' : 'password'
    const urlHint = isSupabase ? HINTS.supabaseUrl : HINTS.plainUrl
    const caHint = isSupabase ? HINTS.supabaseCa : HINTS.plainCa
    const sslOptions = isSupabase ? SSL_OPTIONS.filter(({ value }) => value !== 'off') : SSL_OPTIONS
    const eyeLabel = showUrl ? 'Hide connection string' : 'Show connection string'
    const testLabel = busy === 'test' ? LABELS.testing : LABELS.test
    const useLabel = busy === 'use' ? LABELS.using : LABELS.use
    const resultClass = result?.ok ? 'db-result' : 'form-error'
    const resultRole = result?.ok ? 'status' : 'alert'

    const input: DatabaseInput = {
        url,
        ssl,
        ...(ssl === 'verify' && ca.trim() && { ca }),
    }

    // Running a change

    async function run(kind: 'test' | 'use', work: () => Promise<string>) {
        setBusy(kind)
        setResult(null)

        try {
            setResult({
                ok: true,
                message: await work(),
            })

            if (kind === 'use') {
                onSwitched?.()
            }
        } catch (error) {
            setResult({
                ok: false,
                message: (error as Error).message,
            })
        } finally {
            setBusy(null)
        }
    }

    function testConnection() {
        void run('test', async () => {
            const { label, detail, version } = await api.testDatabase(input)

            return `Connected to ${label} ${detail} (PostgreSQL ${version}).`
        })
    }

    function useExternal(event?: FormEvent) {
        event?.preventDefault()

        void run('use', async () => {
            const database = await switchDatabase(input)

            return `Now using ${database.label} ${database.detail}. ${SIGN_IN_NOTE}`
        })
    }

    function useLocal() {
        void run('use', async () => {
            await switchDatabase({ local: true })

            return `Now using the local database. ${SIGN_IN_NOTE}`
        })
    }

    function useRecent(id: string) {
        void run('use', async () => {
            const used = await switchDatabase({ id })

            return `Now using ${used.label} ${used.detail}. ${SIGN_IN_NOTE}`
        })
    }

    // Fields

    function changeUrl(text: string) {
        setUrl(text)

        if (!sslChosen) {
            setSsl(inferSslMode(text))
        }
    }

    function chooseSsl(mode: SslMode) {
        setSsl(mode)
        setSslChosen(true)
    }

    function toggleUrl() {
        setShowUrl(!showUrl)
    }

    return {
        current,
        choice,
        choices: toChoiceViews(),
        recentRows: toRecentRows(recent, current?.id),
        url,
        ssl,
        ca,
        urlId,
        hintId,
        urlType,
        urlHint,
        caHint,
        sslOptions,
        eyeLabel,
        showUrl,
        isIdle,
        canSubmit,
        testLabel,
        useLabel,
        result,
        resultClass,
        resultRole,
        isLocalInUse: current?.kind === 'local',
        setChoice,
        setCa,
        changeUrl,
        chooseSsl,
        toggleUrl,
        testConnection,
        useExternal,
        useLocal,
        useRecent,
        forgetRecent,
    }
}
