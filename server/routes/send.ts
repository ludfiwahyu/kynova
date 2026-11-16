import { ANSWERED, HttpError, readJson, route } from '#server/http/router.ts'
import { requireUser } from '#server/services/auth.ts'
import { parseSendRequest, type SendProgress, sendRequest } from '#server/services/proxy/proxy.ts'
import { HEADER, MIME, STATUS } from '#shared/http.ts'

/** Progress lines go out at most this often; the last one always does. */
const PROGRESS_EVERY_MS = 100

export const sendRoutes = [
    route('POST', '/api/send', async ({ req }) => {
        await requireUser(req)

        return sendRequest(parseSendRequest(await readJson(req)))
    }),

    /**
     * The same, answered as lines of JSON (NDJSON) while it happens, so the app can show
     * how much of the response has arrived:
     *
     *   {"progress":{"received":0,"total":2048}}
     *   {"progress":{"received":1024,"total":2048}}
     *   {"response":{...}}                     or   {"error":{"status":504,"message":"..."}}
     */
    route('POST', '/api/send/stream', async ({ req, res }) => {
        await requireUser(req)
        const request = parseSendRequest(await readJson(req))

        res.writeHead(200, {
            [HEADER.contentType]: MIME.ndjson,
            [HEADER.cacheControl]: 'no-store',
            'X-Content-Type-Options': 'nosniff',
        })
        const line = (value: unknown) => res.write(`${JSON.stringify(value)}\n`)

        let lastSent = 0
        const onProgress = (progress: SendProgress) => {
            const now = Date.now()
            const done = progress.total !== null && progress.received >= progress.total

            if (now - lastSent < PROGRESS_EVERY_MS && progress.received > 0 && !done) {
                return
            }

            lastSent = now
            line({ progress })
        }

        try {
            line({ response: await sendRequest(request, onProgress) })
        } catch (error) {
            const status = error instanceof HttpError ? error.status : STATUS.serverError
            const message =
                error instanceof HttpError ? error.message : 'Something went wrong on the server.'

            if (!(error instanceof HttpError)) {
                console.error(error)
            }

            line({
                error: {
                    status,
                    message,
                },
            })
        }

        res.end()

        return ANSWERED
    }),
]
