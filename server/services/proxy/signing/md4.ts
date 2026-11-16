export function md4(input: Buffer): Buffer {
    const bitLength = input.length * 8
    const padded = Buffer.alloc(Math.ceil((input.length + 9) / 64) * 64)

    input.copy(padded)
    padded[input.length] = 0x80
    padded.writeUInt32LE(bitLength >>> 0, padded.length - 8)
    padded.writeUInt32LE(Math.floor(bitLength / 2 ** 32), padded.length - 4)

    let [a, b, c, d] = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476]
    const rotate = (x: number, n: number) => (x << n) | (x >>> (32 - n))
    const f = (x: number, y: number, z: number) => (x & y) | (~x & z)
    const g = (x: number, y: number, z: number) => (x & y) | (x & z) | (y & z)
    const h = (x: number, y: number, z: number) => x ^ y ^ z

    for (let offset = 0; offset < padded.length; offset += 64) {
        const x = Array.from({ length: 16 }, (_, i) => padded.readUInt32LE(offset + i * 4))
        const [aa, bb, cc, dd] = [a, b, c, d]

        for (const i of [0, 4, 8, 12]) {
            a = rotate((a + f(b, c, d) + x[i]) | 0, 3)
            d = rotate((d + f(a, b, c) + x[i + 1]) | 0, 7)
            c = rotate((c + f(d, a, b) + x[i + 2]) | 0, 11)
            b = rotate((b + f(c, d, a) + x[i + 3]) | 0, 19)
        }

        for (const i of [0, 1, 2, 3]) {
            a = rotate((a + g(b, c, d) + x[i] + 0x5a827999) | 0, 3)
            d = rotate((d + g(a, b, c) + x[i + 4] + 0x5a827999) | 0, 5)
            c = rotate((c + g(d, a, b) + x[i + 8] + 0x5a827999) | 0, 9)
            b = rotate((b + g(c, d, a) + x[i + 12] + 0x5a827999) | 0, 13)
        }

        for (const i of [0, 2, 1, 3]) {
            a = rotate((a + h(b, c, d) + x[i] + 0x6ed9eba1) | 0, 3)
            d = rotate((d + h(a, b, c) + x[i + 8] + 0x6ed9eba1) | 0, 9)
            c = rotate((c + h(d, a, b) + x[i + 4] + 0x6ed9eba1) | 0, 11)
            b = rotate((b + h(c, d, a) + x[i + 12] + 0x6ed9eba1) | 0, 15)
        }

        a = (a + aa) | 0
        b = (b + bb) | 0
        c = (c + cc) | 0
        d = (d + dd) | 0
    }

    const digest = Buffer.alloc(16)

    ;[a, b, c, d].forEach((word, i) => digest.writeInt32LE(word, i * 4))

    return digest
}
