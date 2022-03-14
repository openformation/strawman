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

import { contract } from "../../../strawman-rc/lib/contract.ts";
import { createJsonRpcTransport } from "../../../jsonrpc/ws/mod.ts";

export const createClient = (localRootUri: URL) => {
  const websocketUri = new URL(localRootUri.toString());
  websocketUri.protocol = "ws";
  websocketUri.pathname = "/__strawman/rc";

  const socket = new WebSocket(websocketUri.toString());
  const client = contract.createClient(
    createJsonRpcTransport({ socket }),
  );

  Deno.addSignalListener("SIGINT", () => {
    socket.close();
  });

  return { client, socket };
};
