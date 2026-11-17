/** The code editor languages a text response can be shown in. */
export type ContentLanguage = 'json' | 'html' | 'xml' | 'javascript' | 'css' | 'yaml' | 'text'

/** Media types to editor languages, first match wins (`+json` and `+xml` suffixes included). */
const CONTENT_LANGUAGES: [RegExp, ContentLanguage][] = [
    [/^application\/(.+\+)?json$|^text\/json$|^application\/x-ndjson$/, 'json'],
    [/^text\/html$|^application\/xhtml\+xml$/, 'html'],
    [/^(application|text)\/(.+\+)?xml$|^image\/svg\+xml$/, 'xml'],
    [/^(application|text)\/(x-)?(javascript|ecmascript)$/, 'javascript'],
    [/^text\/css$/, 'css'],
    [/^(application|text)\/(x-)?yaml$/, 'yaml'],
]

/** The editor language for a `Content-Type` header; anything unknown is plain text. */
export function contentLanguage(contentType: string): ContentLanguage {
    const mime = contentType.split(';')[0].trim().toLowerCase()

    return CONTENT_LANGUAGES.find(([pattern]) => pattern.test(mime))?.[1] ?? 'text'
}

/** Languages the response can lay out (Show formatted), and show as received (Show raw). */
export function isFormattable(language: ContentLanguage): boolean {
    return language === 'json' || language === 'html' || language === 'xml'
}
