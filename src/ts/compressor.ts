export default class Compressor {
    static async compress(text: string): Promise<Blob> {
        const inputReadableStream   = new Blob([text]).stream()
        const compressedStream      = inputReadableStream.pipeThrough(new CompressionStream("gzip"))
        const compressedText        = await new Response(compressedStream).blob()
        return compressedText
    }
    static async decompress(blob: Blob): Promise<string> {
        const compressedStream      = blob.stream()
        const decompressedStream    = compressedStream.pipeThrough(new DecompressionStream("gzip"))
        const decompressedText      = await new Response(decompressedStream).text()
        return decompressedText
    }
}