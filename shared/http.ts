// ===================================================================
//
//   Status codes
//
// ===================================================================

export const STATUS = {
    redirect: 300,
    badRequest: 400,
    unauthorized: 401,
    forbidden: 403,
    notFound: 404,
    conflict: 409,
    payloadTooLarge: 413,
    tooManyRequests: 429,
    serverError: 500,
    badGateway: 502,
    gatewayTimeout: 504,
} as const

// ===================================================================
//
//   Headers
//
// ===================================================================

export const HEADER = {
    authorization: 'Authorization',
    contentType: 'Content-Type',
    cacheControl: 'Cache-Control',
} as const

// ===================================================================
//
//   Content types
//
// ===================================================================

export const MIME = {
    json: 'application/json',
    jsonUtf8: 'application/json; charset=utf-8',
    ndjson: 'application/x-ndjson; charset=utf-8',
    form: 'application/x-www-form-urlencoded',
    text: 'text/plain',
    binary: 'application/octet-stream',
} as const
