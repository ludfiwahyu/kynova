import { MIME } from '#shared/http.ts'

/** Saves text as a file through the browser's download flow. */
export function downloadText(filename: string, text: string, type = MIME.json): void {
    const url = URL.createObjectURL(new Blob([text], { type }))
    const link = document.createElement('a')

    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
}
