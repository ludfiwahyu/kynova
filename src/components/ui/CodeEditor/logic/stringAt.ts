// The quoted string of `line` that touches `offset`: where its opening quote is, and where
// the text after its closing quote starts. Either quote may be `"` or `'`; a backslash escapes.
// A `//` outside a string starts a comment, and nothing after it is read.
export function stringAt(line: string, offset: number): { start: number;
end: number } | null {
    let index = 0

    while (index < line.length) {
        const character = line[index]

        if (character === '/' && line[index + 1] === '/') {
            return null
        }

        if (character !== '"' && character !== "'") {
            index += 1

            continue
        }

        let end = index + 1

        while (end < line.length && line[end] !== character) {
            end += line[end] === '\\' ? 2 : 1
        }

        // An unfinished string reaches the end of the line.
        const after = Math.min(end + 1, line.length)

        if (offset >= index && offset <= after) {
            return {
                start: index,
                end: after,
            }
        }

        index = after
    }

    return null
}
