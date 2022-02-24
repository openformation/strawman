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
  JsonRpcSingleResultMethodContract,
} from "../../model/JsonRpcContract.ts";
import type { JsonRpcRequest } from "../../model/JsonRpcRequest.ts";
import type { JsonRpcResponse } from "../../model/JsonRpcResponse.ts";
import type { JsonRpcServerImplementation } from "../../model/JsonRpcServer.ts";

import { JsonRpcException } from "../../model/JsonRpcError.ts";

type MethodImplementation = (
  params: unknown,
) => Promise<unknown>;

export const makeHandleSingleResultRequest = (deps: {
  serverImplementation: JsonRpcServerImplementation;
  respond: (response: JsonRpcResponse) => void | Promise<void>;
}) => {
  const handleSingleResultRequest = async (
    request: JsonRpcRequest,
    methodContract: JsonRpcSingleResultMethodContract,
  ) => {
    try {
      const methodImplementation = deps
        .serverImplementation[request.method] as MethodImplementation;

      deps.respond({
        jsonrpc: "2.0",
        result: methodContract.result.ensure(
          await methodImplementation(
            methodContract.params?.ensure(
              request.params,
            ),
          ),
        ),
        id: request.id,
      });
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

  return handleSingleResultRequest;
};
