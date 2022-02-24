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

import { castError } from "../../../framework/castError.ts";

import type { JsonRpcRequest } from "../../model/JsonRpcRequest.ts";
import type { JsonRpcResponse } from "../../model/JsonRpcResponse.ts";

import { JsonRpcException } from "../../model/JsonRpcError.ts";

export const makeHandleError = (deps: {
  respond: (response: JsonRpcResponse) => void | Promise<void>;
}) => {
  const handleError = (request: JsonRpcRequest, error: unknown) => {
    if (error instanceof JsonRpcException) {
      deps.respond({
        jsonrpc: "2.0",
        error: error.toJsonRpcError(),
        id: request.id,
      });
    } else {
      deps.respond({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Unexpected Error",
          data: {
            reason: castError(error).message,
          },
        },
        id: request.id,
      });
    }
  };

  return handleError;
};
