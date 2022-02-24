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

import { ValidationError } from "../../../schema/mod.ts";

import type {
  JsonRpcIterableResultMethodContract,
} from "../../model/JsonRpcContract.ts";
import type { JsonRpcRequest } from "../../model/JsonRpcRequest.ts";
import type { JsonRpcResponse } from "../../model/JsonRpcResponse.ts";
import type { JsonRpcServerImplementation } from "../../model/JsonRpcServer.ts";

import { JsonRpcException } from "../../model/JsonRpcError.ts";

type IterableMethodImplementation = (
  params: unknown,
) => AsyncIterable<unknown>;

export const makeHandleIterableResultRequest = (deps: {
  serverImplementation: JsonRpcServerImplementation;
  respond: (response: JsonRpcResponse) => void | Promise<void>;
}) => {
  const handleIterableResultRequest = async (
    request: JsonRpcRequest,
    methodContract: JsonRpcIterableResultMethodContract,
  ) => {
    try {
      const methodImplementation = deps
        .serverImplementation[request.method] as IterableMethodImplementation;
      const results = methodImplementation(
        methodContract.params?.ensure(
          request.params,
        ),
      );

      for await (const result of results) {
        deps.respond({
          jsonrpc: "2.0",
          result: methodContract.result[0].ensure(result),
          id: request.id,
        });
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw JsonRpcException.raiseInternal({
          code: -32602,
          message: "Invalid params",
          data: {
            reason: error.message,
          },
        });
      } else throw error;
    }
  };

  return handleIterableResultRequest;
};
