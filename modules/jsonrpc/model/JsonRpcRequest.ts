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

import { JsonRpcException } from "./JsonRpcError.ts";

export type JsonRpcRequest<Method extends string = string, Params = unknown> = {
  jsonrpc: "2.0";
  method: Method;
  params?: Params;
  id: number;
};

export const jsonRpcRequestSchema = s.record({
  jsonrpc: s.literal("2.0"),
  method: s.string(),
  params: s.optional(s.defined()),
  id: s.integer(),
});

export const JsonRpcRequestCodec = {
  decode: (string: string) => {
    try {
      return jsonRpcRequestSchema.ensure(JSON.parse(string));
    } catch (err) {
      console.log(err);
      throw JsonRpcException.raiseInternal({
        code: -32700,
        message: "Parse error",
        data: {
          reason: castError(err).message,
        },
      });
    }
  },
  encode: (jsonRpcRequest: JsonRpcRequest) => JSON.stringify(jsonRpcRequest),
} as const;
