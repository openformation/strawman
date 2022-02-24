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

import type {
  JsonRpcContract,
  JsonRpcIterableResultMethodContract,
  JsonRpcSingleResultMethodContract,
} from "../../model/JsonRpcContract.ts";
import { JsonRpcException } from "../../model/JsonRpcError.ts";
import type { JsonRpcRequest } from "../../model/JsonRpcRequest.ts";
import { JsonRpcRequestCodec } from "../../model/JsonRpcRequest.ts";
import type { JsonRpcResponse } from "../../model/JsonRpcResponse.ts";
import { JsonRpcResponseCodec } from "../../model/JsonRpcResponse.ts";
import type {
  JsonRpcServer,
  JsonRpcServerImplementation,
} from "../../model/JsonRpcServer.ts";
import type { JsonRpcTransport } from "../../model/JsonRpcTransport.ts";

import { makeHandleError } from "./handleError.ts";
import { makeHandleSingleResultRequest } from "./handleSingleResultRequest.ts";
import { makeHandleIterableResultRequest } from "./handleIterableResultRequest.ts";

export const createServer = <Contract extends JsonRpcContract>(
  contract: Contract,
  serverImplementation: JsonRpcServerImplementation<Contract>,
): JsonRpcServer =>
  Object.freeze({
    run: async (transport: JsonRpcTransport) => {
      const respond = (response: JsonRpcResponse) =>
        transport.send(JsonRpcResponseCodec.encode(response));
      const handleError = makeHandleError({
        respond,
      });
      const handleSingleResultRequest = makeHandleSingleResultRequest({
        serverImplementation,
        respond,
      });
      const handleIterableResultRequest = makeHandleIterableResultRequest({
        serverImplementation,
        respond,
      });

      const handleRequest = (request: JsonRpcRequest) => {
        if (!(request.method in contract)) {
          throw JsonRpcException.raiseInternal({
            code: -32601,
            message: "Method not found",
            data: {
              reason: `Method "${request.method}" is not part of the contract.`,
            },
          });
        }

        if (!(request.method in serverImplementation)) {
          throw JsonRpcException.raiseInternal({
            code: -32601,
            message: "Method not found",
            data: {
              reason: `Method "${request.method}" is not implemented.`,
            },
          });
        }

        const methodContract = contract[request.method];

        if (Array.isArray(methodContract.result)) {
          handleIterableResultRequest(
            request,
            methodContract as JsonRpcIterableResultMethodContract,
          );
        } else {
          handleSingleResultRequest(
            request,
            methodContract as JsonRpcSingleResultMethodContract,
          );
        }
      };

      for await (const requestAsString of transport.receive()) {
        const request = JsonRpcRequestCodec.decode(requestAsString);

        try {
          handleRequest(request);
        } catch (error) {
          handleError(request, error);
        }
      }
    },
  });
