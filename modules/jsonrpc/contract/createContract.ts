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

import * as SchemaHelpers from "../../schema/mod.ts";

import type { JsonRpcContract } from "../model/JsonRpcContract.ts";
import type { JsonRpcTransport } from "../model/JsonRpcTransport.ts";
import type { JsonRpcServerImplementation } from "../model/JsonRpcServer.ts";

import { createServer } from "./server/createServer.ts";
import { createClient } from "./createClient.ts";

export const createContract = <C extends JsonRpcContract>(
  factory: (s: typeof SchemaHelpers) => C,
) => {
  const contract = factory(SchemaHelpers);

  return {
    createServer: (implementation: JsonRpcServerImplementation<C>) =>
      createServer(contract, implementation),
    createClient: (transport: JsonRpcTransport) =>
      createClient(contract, transport),
  };
};
