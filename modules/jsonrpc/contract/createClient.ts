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

import type { Validator } from "../../schema/mod.ts";

import type { JsonRpcContract } from "../model/JsonRpcContract.ts";
import { JsonRpcException } from "../model/JsonRpcError.ts";
import type { JsonRpcRequest } from "../model/JsonRpcRequest.ts";
import { JsonRpcRequestCodec } from "../model/JsonRpcRequest.ts";
import type { JsonRpcResponse } from "../model/JsonRpcResponse.ts";
import { JsonRpcResponseCodec } from "../model/JsonRpcResponse.ts";
import type { JsonRpcClient } from "../model/JsonRpcClient.ts";
import type { JsonRpcTransport } from "../model/JsonRpcTransport.ts";

export const createClient = <C extends JsonRpcContract>(
  contract: C,
  transport: JsonRpcTransport,
): JsonRpcClient<C> => {
  const deferredResponseHandlers = new Map<
    number,
    (response: JsonRpcResponse) => void
  >();
  let idSeq = 0;

  (async () => {
    for await (const responseAsString of transport.receive()) {
      const response = JsonRpcResponseCodec.decode(responseAsString);

      if (deferredResponseHandlers.has(response.id)) {
        deferredResponseHandlers.get(response.id)!(response);
        deferredResponseHandlers.delete(response.id);
      }
    }
  })();

  const send = (request: JsonRpcRequest) =>
    transport.send(JsonRpcRequestCodec.encode(request));

  return Object.freeze(
    Object.fromEntries(
      Object.entries(contract).map((
        [key, methodContract],
      ) => [key, (params: unknown) => {
        const request: JsonRpcRequest = {
          jsonrpc: "2.0",
          method: key,
          ...(methodContract.params !== undefined &&
            { params: methodContract.params.ensure(params) }),
          id: idSeq++,
        };

        send(request);

        if (Array.isArray(methodContract.result)) {
          const [resultSchema] =
            (methodContract.result as [Validator<unknown>]);

          return Object.freeze({
            [Symbol.asyncIterator]: () => ({
              next: () =>
                new Promise((resolve, reject) =>
                  deferredResponseHandlers.set(request.id, (response) => {
                    if ("result" in response) {
                      resolve({
                        value: resultSchema.ensure(response.result),
                        done: false,
                      });
                    } else if ("error" in response) {
                      reject(JsonRpcException.fromJsonRpcError(response.error));
                    }
                  })
                ),
              return: () => {
                deferredResponseHandlers.delete(request.id);
                return Promise.resolve({ value: undefined, done: true });
              },
            }),
          });
        } else {
          const resultSchema = (methodContract.result as Validator<unknown>);

          return new Promise((resolve, reject) =>
            deferredResponseHandlers.set(request.id, (response) => {
              if ("result" in response) {
                resolve(resultSchema.ensure(response.result));
              } else if ("error" in response) {
                reject(JsonRpcException.fromJsonRpcError(response.error));
              }
            })
          );
        }
      }]),
    ),
  ) as unknown as JsonRpcClient<C>;
};
