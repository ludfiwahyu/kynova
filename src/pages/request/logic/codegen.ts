import type { CodeLanguage } from '@/components'
import type { SendRequest } from '#shared/types.ts'

export type SnippetLanguage =
    | 'c-libcurl'
    | 'csharp-httpclient'
    | 'csharp-restsharp'
    | 'curl'
    | 'dart-dio'
    | 'dart-http'
    | 'go'
    | 'http'
    | 'java-okhttp'
    | 'java-unirest'
    | 'fetch'
    | 'xhr'
    | 'axios'
    | 'php-curl'
    | 'python'
    | 'ruby'

/** How the code editor colours each snippet. */
const SNIPPET_EDITOR_LANGUAGES: Record<SnippetLanguage, CodeLanguage> = {
    'c-libcurl': 'c',
    'csharp-httpclient': 'csharp',
    'csharp-restsharp': 'csharp',
    curl: 'shell',
    'dart-dio': 'dart',
    'dart-http': 'dart',
    go: 'go',
    http: 'http',
    'java-okhttp': 'java',
    'java-unirest': 'java',
    fetch: 'javascript',
    xhr: 'javascript',
    axios: 'javascript',
    'php-curl': 'php',
    python: 'python',
    ruby: 'ruby',
}

export function snippetEditorLanguage(language: SnippetLanguage): CodeLanguage {
    return SNIPPET_EDITOR_LANGUAGES[language]
}

export const SNIPPET_LANGUAGES: {
    id: SnippetLanguage
    label: string
}[] = [
    {
        id: 'c-libcurl',
        label: 'C - libcurl',
    },
    {
        id: 'csharp-httpclient',
        label: 'C# - HttpClient',
    },
    {
        id: 'csharp-restsharp',
        label: 'C# - RestSharp',
    },
    {
        id: 'curl',
        label: 'cURL',
    },
    {
        id: 'dart-dio',
        label: 'Dart - dio',
    },
    {
        id: 'dart-http',
        label: 'Dart - http',
    },
    {
        id: 'go',
        label: 'Go - Native',
    },
    {
        id: 'http',
        label: 'HTTP',
    },
    {
        id: 'java-okhttp',
        label: 'Java - OkHttp',
    },
    {
        id: 'java-unirest',
        label: 'Java - Unirest',
    },
    {
        id: 'fetch',
        label: 'JavaScript - Fetch',
    },
    {
        id: 'xhr',
        label: 'JavaScript - XHR',
    },
    {
        id: 'axios',
        label: 'NodeJs - Axios',
    },
    {
        id: 'php-curl',
        label: 'PHP - cURL',
    },
    {
        id: 'python',
        label: 'Python - Requests',
    },
    {
        id: 'ruby',
        label: 'Ruby - Net::HTTP',
    },
]

/** Wraps text in single quotes for a POSIX shell. */
function shellQuote(text: string): string {
    return `'${text.replaceAll("'", `'\\''`)}'`
}

function curl({ method, url, headers, body }: SendRequest): string {
    const lines = [`curl --request ${method} ${shellQuote(url)}`]

    for (const [name, value] of headers) {
        lines.push(`--header ${shellQuote(`${name}: ${value}`)}`)
    }

    if (body !== null) {
        lines.push(`--data ${shellQuote(body)}`)
    }

    return lines.join(' \\\n  ')
}

function fetchSnippet({ method, url, headers, body }: SendRequest): string {
    const options: Record<string, unknown> = { method }

    if (headers.length > 0) {
        options.headers = Object.fromEntries(headers)
    }

    if (body !== null) {
        options.body = body
    }

    return [
        `const response = await fetch(${JSON.stringify(url)}, ${JSON.stringify(options, null, 2)});`,
        '',
        'console.log(response.status, await response.text());',
    ].join('\n')
}

function python({ method, url, headers, body }: SendRequest): string {
    const args = [JSON.stringify(method), JSON.stringify(url)]

    // A JSON object of strings is also a valid Python dict literal.
    if (headers.length > 0) {
        args.push(`headers=${JSON.stringify(Object.fromEntries(headers), null, 4)}`)
    }

    if (body !== null) {
        args.push(`data=${JSON.stringify(body)}`)
    }

    return [
        'import requests',
        '',
        `response = requests.request(${args.join(', ')})`,
        '',
        'print(response.status_code, response.text)',
    ].join('\n')
}

/** A double-quoted string literal: JSON's escapes are valid in C, C#, Go, Java and Dart. */
const quote = (text: string): string => JSON.stringify(text)

/** The same, with `$` escaped for Dart, where it starts an interpolation. */
const dartQuote = (text: string): string => quote(text).replaceAll('$', '\\$')

/** A single-quoted string for PHP and Ruby: only `\` and `'` need escaping. */
const singleQuote = (text: string): string => `'${text.replace(/[\\']/g, '\\$&')}'`

const needsBody = (method: string): boolean => ['POST', 'PUT', 'PATCH'].includes(method)

const isContentHeader = (name: string): boolean => name.toLowerCase().startsWith('content-')

const headerValue = (headers: [string, string][], name: string): string | undefined =>
    headers.find(([key]) => key.toLowerCase() === name)?.[1]

const capitalized = (method: string): string =>
    method.charAt(0).toUpperCase() + method.slice(1).toLowerCase()

function cLibcurl({ method, url, headers, body }: SendRequest): string {
    const lines = [
        'CURL *curl = curl_easy_init();',
        'if (curl) {',
        `  curl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST, ${quote(method)});`,
        `  curl_easy_setopt(curl, CURLOPT_URL, ${quote(url)});`,
    ]

    if (headers.length > 0) {
        lines.push('  struct curl_slist *headers = NULL;')

        for (const [name, value] of headers) {
            lines.push(`  headers = curl_slist_append(headers, ${quote(`${name}: ${value}`)});`)
        }

        lines.push('  curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);')
    }

    if (body !== null) {
        lines.push(`  curl_easy_setopt(curl, CURLOPT_POSTFIELDS, ${quote(body)});`)
    }

    lines.push('  CURLcode res = curl_easy_perform(curl);')

    if (headers.length > 0) {
        lines.push('  curl_slist_free_all(headers);')
    }

    lines.push('}', 'curl_easy_cleanup(curl);')

    return lines.join('\n')
}

function csharpHttpClient({ method, url, headers, body }: SendRequest): string {
    const lines = [
        'var client = new HttpClient();',
        `var request = new HttpRequestMessage(new HttpMethod(${quote(method)}), ${quote(url)});`,
    ]

    for (const [name, value] of headers) {
        if (body !== null && isContentHeader(name)) {
            continue
        }

        lines.push(`request.Headers.TryAddWithoutValidation(${quote(name)}, ${quote(value)});`)
    }

    if (body !== null) {
        const type = headerValue(headers, 'content-type') ?? 'text/plain'

        lines.push(
            `request.Content = new StringContent(${quote(body)}, System.Text.Encoding.UTF8, ${quote(type)});`,
        )
    }

    lines.push(
        'var response = await client.SendAsync(request);',
        'response.EnsureSuccessStatusCode();',
        'Console.WriteLine(await response.Content.ReadAsStringAsync());',
    )

    return lines.join('\n')
}

function csharpRestSharp({ method, url, headers, body }: SendRequest): string {
    const lines = [
        `var options = new RestClientOptions(${quote(url)});`,
        'var client = new RestClient(options);',
        `var request = new RestRequest("", Method.${capitalized(method)});`,
    ]

    for (const [name, value] of headers) {
        if (body !== null && name.toLowerCase() === 'content-type') {
            continue
        }

        lines.push(`request.AddHeader(${quote(name)}, ${quote(value)});`)
    }

    if (body !== null) {
        const type = headerValue(headers, 'content-type') ?? 'text/plain'

        lines.push(
            `request.AddParameter(${quote(type)}, ${quote(body)}, ParameterType.RequestBody);`,
        )
    }

    lines.push(
        'RestResponse response = await client.ExecuteAsync(request);',
        'Console.WriteLine(response.Content);',
    )

    return lines.join('\n')
}

function dartDio({ method, url, headers, body }: SendRequest): string {
    const lines = [
        "import 'package:dio/dio.dart';",
        '',
        'void main() async {',
        '  final dio = Dio();',
    ]
    const options = [`method: ${dartQuote(method)}`]

    if (headers.length > 0) {
        const entries = headers.map(([name, value]) => `${dartQuote(name)}: ${dartQuote(value)}`)

        options.push(`headers: {${entries.join(', ')}}`)
    }

    lines.push(
        '  final response = await dio.request(',
        `    ${dartQuote(url)},`,
        `    options: Options(${options.join(', ')}),`,
    )

    if (body !== null) {
        lines.push(`    data: ${dartQuote(body)},`)
    }

    lines.push('  );', '  print(response.statusCode);', '  print(response.data);', '}')

    return lines.join('\n')
}

function dartHttp({ method, url, headers, body }: SendRequest): string {
    const lines = [
        "import 'package:http/http.dart' as http;",
        '',
        'void main() async {',
        `  final request = http.Request(${dartQuote(method)}, Uri.parse(${dartQuote(url)}));`,
    ]

    if (headers.length > 0) {
        const entries = headers.map(([name, value]) => `${dartQuote(name)}: ${dartQuote(value)}`)

        lines.push(`  request.headers.addAll({${entries.join(', ')}});`)
    }

    if (body !== null) {
        lines.push(`  request.body = ${dartQuote(body)};`)
    }

    lines.push(
        '  final response = await request.send();',
        '  print(response.statusCode);',
        '  print(await response.stream.bytesToString());',
        '}',
    )

    return lines.join('\n')
}

function goNative({ method, url, headers, body }: SendRequest): string {
    const imports = ['fmt', 'io', 'net/http']

    if (body !== null) {
        imports.push('strings')
    }

    const lines = [
        'package main',
        '',
        'import (',
        ...imports.sort().map((name) => `\t"${name}"`),
        ')',
        '',
        'func main() {',
        `\turl := ${quote(url)}`,
        `\tmethod := ${quote(method)}`,
    ]

    if (body !== null) {
        lines.push(`\tpayload := strings.NewReader(${quote(body)})`)
    }

    lines.push(
        '',
        '\tclient := &http.Client{}',
        `\treq, err := http.NewRequest(method, url, ${body !== null ? 'payload' : 'nil'})`,
        '\tif err != nil {',
        '\t\tfmt.Println(err)',
        '\t\treturn',
        '\t}',
    )

    for (const [name, value] of headers) {
        lines.push(`\treq.Header.Add(${quote(name)}, ${quote(value)})`)
    }

    lines.push(
        '',
        '\tres, err := client.Do(req)',
        '\tif err != nil {',
        '\t\tfmt.Println(err)',
        '\t\treturn',
        '\t}',
        '\tdefer res.Body.Close()',
        '',
        '\tbody, err := io.ReadAll(res.Body)',
        '\tif err != nil {',
        '\t\tfmt.Println(err)',
        '\t\treturn',
        '\t}',
        '\tfmt.Println(string(body))',
        '}',
    )

    return lines.join('\n')
}

function rawHttp({ method, url, headers, body }: SendRequest): string {
    let host = ''
    let target = url

    try {
        const parsed = new URL(url)

        host = parsed.host
        target = `${parsed.pathname}${parsed.search}` || '/'
    } catch {
        // Not a full URL (for instance a variable that is still empty): print it as it is.
    }

    const lines = [`${method} ${target} HTTP/1.1`]

    if (host && headerValue(headers, 'host') === undefined) {
        lines.push(`Host: ${host}`)
    }

    for (const [name, value] of headers) {
        lines.push(`${name}: ${value}`)
    }

    if (body !== null && headerValue(headers, 'content-length') === undefined) {
        lines.push(`Content-Length: ${new TextEncoder().encode(body).length}`)
    }

    lines.push('')

    if (body !== null) {
        lines.push(body)
    }

    return lines.join('\n')
}

function javaOkHttp({ method, url, headers, body }: SendRequest): string {
    const lines = ['OkHttpClient client = new OkHttpClient().newBuilder().build();']
    let requestBody = 'null'

    if (body !== null) {
        const type = headerValue(headers, 'content-type') ?? 'text/plain'

        lines.push(
            `MediaType mediaType = MediaType.parse(${quote(type)});`,
            `RequestBody body = RequestBody.create(mediaType, ${quote(body)});`,
        )
        requestBody = 'body'
    } else if (needsBody(method)) {
        lines.push('RequestBody body = RequestBody.create(null, new byte[0]);')
        requestBody = 'body'
    }

    lines.push(
        'Request request = new Request.Builder()',
        `  .url(${quote(url)})`,
        `  .method(${quote(method)}, ${requestBody})`,
    )

    for (const [name, value] of headers) {
        lines.push(`  .addHeader(${quote(name)}, ${quote(value)})`)
    }

    lines.push('  .build();', 'Response response = client.newCall(request).execute();')

    return lines.join('\n')
}

function javaUnirest({ method, url, headers, body }: SendRequest): string {
    const lines = [
        'Unirest.setTimeouts(0, 0);',
        `HttpResponse<String> response = Unirest.${method.toLowerCase()}(${quote(url)})`,
    ]

    for (const [name, value] of headers) {
        lines.push(`  .header(${quote(name)}, ${quote(value)})`)
    }

    if (body !== null) {
        lines.push(`  .body(${quote(body)})`)
    }

    lines.push('  .asString();')

    return lines.join('\n')
}

function xhr({ method, url, headers, body }: SendRequest): string {
    const lines = [
        'const xhr = new XMLHttpRequest();',
        '',
        "xhr.addEventListener('readystatechange', function () {",
        '  if (this.readyState === 4) {',
        '    console.log(this.status, this.responseText);',
        '  }',
        '});',
        '',
        `xhr.open(${quote(method)}, ${quote(url)});`,
    ]

    for (const [name, value] of headers) {
        lines.push(`xhr.setRequestHeader(${quote(name)}, ${quote(value)});`)
    }

    lines.push('', body !== null ? `xhr.send(${quote(body)});` : 'xhr.send();')

    return lines.join('\n')
}

function axios({ method, url, headers, body }: SendRequest): string {
    const config: Record<string, unknown> = {
        method,
        url,
    }

    if (headers.length > 0) {
        config.headers = Object.fromEntries(headers)
    }

    if (body !== null) {
        config.data = body
    }

    return [
        "const axios = require('axios');",
        '',
        `const response = await axios.request(${JSON.stringify(config, null, 2)});`,
        '',
        'console.log(response.status, response.data);',
    ].join('\n')
}

function phpCurl({ method, url, headers, body }: SendRequest): string {
    const lines = [
        '<?php',
        '',
        '$curl = curl_init();',
        '',
        'curl_setopt_array($curl, [',
        `  CURLOPT_URL => ${singleQuote(url)},`,
        '  CURLOPT_RETURNTRANSFER => true,',
        `  CURLOPT_CUSTOMREQUEST => ${singleQuote(method)},`,
    ]

    if (body !== null) {
        lines.push(`  CURLOPT_POSTFIELDS => ${singleQuote(body)},`)
    }

    if (headers.length > 0) {
        const entries = headers.map(([name, value]) => `    ${singleQuote(`${name}: ${value}`)},`)

        lines.push('  CURLOPT_HTTPHEADER => [', ...entries, '  ],')
    }

    lines.push(
        ']);',
        '',
        '$response = curl_exec($curl);',
        'curl_close($curl);',
        '',
        'echo $response;',
    )

    return lines.join('\n')
}

function ruby({ method, url, headers, body }: SendRequest): string {
    const lines = [
        "require 'uri'",
        "require 'net/http'",
        '',
        `uri = URI(${singleQuote(url)})`,
        'http = Net::HTTP.new(uri.host, uri.port)',
    ]

    if (url.toLowerCase().startsWith('https:')) {
        lines.push('http.use_ssl = true')
    }

    lines.push(
        '',
        `request = Net::HTTPGenericRequest.new(${singleQuote(method)}, ${body !== null || needsBody(method)}, true, uri)`,
    )

    for (const [name, value] of headers) {
        lines.push(`request[${singleQuote(name)}] = ${singleQuote(value)}`)
    }

    if (body !== null) {
        lines.push(`request.body = ${singleQuote(body)}`)
    }

    lines.push('', 'response = http.request(request)', 'puts response.code, response.body')

    return lines.join('\n')
}

const GENERATORS: Record<SnippetLanguage, (request: SendRequest) => string> = {
    'c-libcurl': cLibcurl,
    'csharp-httpclient': csharpHttpClient,
    'csharp-restsharp': csharpRestSharp,
    curl,
    'dart-dio': dartDio,
    'dart-http': dartHttp,
    go: goNative,
    http: rawHttp,
    'java-okhttp': javaOkHttp,
    'java-unirest': javaUnirest,
    fetch: fetchSnippet,
    xhr,
    axios,
    'php-curl': phpCurl,
    python,
    ruby,
}

export function generateSnippet(language: SnippetLanguage, request: SendRequest): string {
    return GENERATORS[language](request)
}
