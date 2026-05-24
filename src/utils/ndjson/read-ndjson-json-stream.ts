export async function* readNdjsonJsonStream(
  body: ReadableStream<Uint8Array>,
): AsyncIterable<unknown> {
  const decoder = new TextDecoder();
  const reader = body.getReader();
  let buffer = "";

  try {
    while (true) {
      const result = await reader.read();

      if (result.done) {
        break;
      }

      buffer += decoder.decode(result.value, { stream: true });
      buffer = normalizeLineEndings(buffer);

      while (true) {
        const line = readNextLine(buffer);

        if (line === undefined) {
          break;
        }

        buffer = line.rest;

        if (line.value.length === 0) {
          continue;
        }

        yield JSON.parse(line.value);
      }
    }

    buffer += decoder.decode();
    buffer = normalizeLineEndings(buffer).trim();

    if (buffer.length > 0) {
      yield JSON.parse(buffer);
    }
  } finally {
    reader.releaseLock();
  }
}

interface NdjsonLine {
  rest: string;
  value: string;
}

function readNextLine(buffer: string): NdjsonLine | undefined {
  const delimiterIndex = buffer.indexOf("\n");

  if (delimiterIndex === -1) {
    return undefined;
  }

  return {
    value: buffer.slice(0, delimiterIndex).trim(),
    rest: buffer.slice(delimiterIndex + 1),
  };
}

function normalizeLineEndings(value: string): string {
  return value.replaceAll("\r\n", "\n");
}
