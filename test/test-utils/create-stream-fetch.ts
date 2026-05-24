import type { FetchLike } from "../../src/index";
import type { FetchCall } from "./types";

export function createStreamFetch(chunks: readonly string[]): {
  calls: FetchCall[];
  fetch: FetchLike;
} {
  const calls: FetchCall[] = [];
  const responseText = chunks.join("");

  return {
    calls,
    fetch: async (input, init) => {
      calls.push(init === undefined ? { input } : { input, init });

      return {
        body: createReadableByteStream(chunks),
        ok: true,
        status: 200,
        statusText: "OK",
        async json() {
          return {};
        },
        async text() {
          return responseText;
        },
      };
    },
  };
}

export async function readTextStream(stream: ReadableStream<string>): Promise<string> {
  const chunks = await readStream(stream);

  return chunks.join("");
}

export async function readStream<TValue>(stream: ReadableStream<TValue>): Promise<TValue[]> {
  const reader = stream.getReader();
  const values: TValue[] = [];

  try {
    while (true) {
      const result = await reader.read();

      if (result.done) {
        break;
      }

      values.push(result.value);
    }
  } finally {
    reader.releaseLock();
  }

  return values;
}

function createReadableByteStream(chunks: readonly string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }

      controller.close();
    },
  });
}
