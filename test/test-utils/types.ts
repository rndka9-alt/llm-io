import type { FetchLike } from "../../src/index";

export interface FetchCall {
  input: string;
  init?: Parameters<FetchLike>[1];
}
