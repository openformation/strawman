/**
 * strawman - A Deno-based service virtualization solution
 * Copyright (C) 2022 Open Formation GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * @author Wilhelm Behncke <wilhelm.behncke@openformation.io>
 */

import { castError } from "../../framework/castError.ts";

import * as s from "../../schema/mod.ts";

import type { JsonRpcError } from "./JsonRpcError.ts";
import { jsonRpcErrorSchema, JsonRpcException } from "./JsonRpcError.ts";

export type JsonRpcResultResponse<Result = unknown> = {
  jsonrpc: "2.0";
  result: Result;
  id: number;
};

export type JsonRpcErrorResponse<Error extends JsonRpcError = JsonRpcError> = {
  jsonrpc: "2.0";
  error: Error;
  id: number;
};

export type JsonRpcResponse = JsonRpcResultResponse | JsonRpcErrorResponse;

export const jsonRpcSuccessResponseSchema = s.record({
  jsonrpc: s.literal("2.0"),
  result: s.defined(),
  id: s.integer(),
});

export const jsonRpcErrorResponseSchema = s.record({
  jsonrpc: s.literal("2.0"),
  error: jsonRpcErrorSchema,
  id: s.integer(),
});

export const jsonRpcResponseSchema = s.union(
  jsonRpcSuccessResponseSchema,
  jsonRpcErrorResponseSchema,
);

export const JsonRpcResponseCodec = {
  decode: (string: string) => {
    try {
      return jsonRpcResponseSchema.ensure(JSON.parse(string));
    } catch (err) {
      throw JsonRpcException.raiseInternal({
        code: -32700,
        message: "Parse error",
        data: {
          reason: castError(err).message,
        },
      });
    }
  },
  encode: (jsonRpcResponse: JsonRpcResponse) => JSON.stringify(jsonRpcResponse),
} as const;
