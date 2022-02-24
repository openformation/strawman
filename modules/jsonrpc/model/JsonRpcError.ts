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

import * as s from "../../schema/mod.ts";

export type JsonRpcError<Data = unknown> = {
  code: number;
  message: string;
  data?: Data;
};

export const jsonRpcErrorSchema = s.record({
  code: s.integer(),
  message: s.string(),
  data: s.optional(s.defined()),
});

export class JsonRpcException<Data = unknown> extends Error {
  private constructor(
    private readonly props: {
      code: number;
      message: string;
      data?: Data;
    },
  ) {
    super(`#${props.code}: ${props.message}`);
  }

  public readonly toJsonRpcError = (): JsonRpcError<Data> => ({
    ...this.props,
  });

  public static readonly fromJsonRpcError = <
    Data = unknown,
  >(jsonRpcError: JsonRpcError<Data>) => new JsonRpcException(jsonRpcError);

  public static readonly raise = <
    Data = unknown,
  >(props: {
    code: number;
    message: string;
    data?: Data;
  }) => {
    switch (props.code) {
      case -32700:
      case -32600:
      case -32601:
      case -32602:
      case -32603:
        throw new JsonRpcException({
          code: -32603,
          message: `Internal Error`,
          data: {
            reason:
              `Error code ${props.code} is reserved for pre-defined errors.`,
          },
        });
      case -32098:
        throw new JsonRpcException({
          code: -32603,
          message: `Internal Error`,
          data: {
            reason:
              `Error code ${props.code} is reserved for unexpected errors.`,
          },
        });
      default:
        if (props.code >= -32098 && props.code <= -32000) {
          throw new JsonRpcException({
            code: -32603,
            message: `Internal Error`,
            data: {
              reason:
                `Error code ${props.code} is reserved for implementation-defined server-errors.`,
            },
          });
        } else {
          return new JsonRpcException<Data>(props);
        }
    }
  };

  public static readonly raiseInternal = <
    Data = unknown,
  >(props: {
    code: number;
    message: string;
    data?: Data;
  }) => {
    switch (props.code) {
      case -32700:
      case -32600:
      case -32601:
      case -32602:
      case -32603:
        return new JsonRpcException<Data>(props);
      default:
        throw new JsonRpcException({
          code: -32603,
          message: `Internal Error`,
          data: {
            reason:
              `Error code ${props.code} is not a valid internal error code.`,
          },
        });
    }
  };
}
