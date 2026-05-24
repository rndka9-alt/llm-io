export async function* readSseJsonStream(body: ReadableStream<Uint8Array>): AsyncIterable<unknown> {
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
        const event = readNextRawSseEvent(buffer);

        if (event === undefined) {
          break;
        }

        buffer = event.rest;

        const data = readSseData(event.rawEvent);

        if (data === undefined) {
          continue;
        }

        if (data === "[DONE]") {
          return;
        }

        yield JSON.parse(data);
      }
    }

    buffer += decoder.decode();
    buffer = normalizeLineEndings(buffer);

    const data = readSseData(buffer);

    if (data !== undefined && data !== "[DONE]") {
      yield JSON.parse(data);
    }
  } finally {
    reader.releaseLock();
  }
}

interface RawSseEvent {
  rawEvent: string;
  rest: string;
}

function readNextRawSseEvent(buffer: string): RawSseEvent | undefined {
  const delimiterIndex = buffer.indexOf("\n\n");

  if (delimiterIndex === -1) {
    return undefined;
  }

  return {
    rawEvent: buffer.slice(0, delimiterIndex),
    rest: buffer.slice(delimiterIndex + 2),
  };
}

function readSseData(rawEvent: string): string | undefined {
  const dataLines = rawEvent
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map(readSseDataLine);

  if (dataLines.length === 0) {
    return undefined;
  }

  return dataLines.join("\n");
}

function readSseDataLine(line: string): string {
  const value = line.slice("data:".length);

  if (value.startsWith(" ")) {
    return value.slice(1);
  }

  return value;
}

function normalizeLineEndings(value: string): string {
  return value.replaceAll("\r\n", "\n");
}
