export class LlmIoError extends Error {
  readonly cause: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "LlmIoError";
    this.cause = cause;
  }
}

export class LlmHttpError extends LlmIoError {
  readonly status: number;
  readonly body: string;

  constructor(status: number, body: string) {
    super(`LLM request failed with status ${status}.`);
    this.name = "LlmHttpError";
    this.status = status;
    this.body = body;
  }
}
