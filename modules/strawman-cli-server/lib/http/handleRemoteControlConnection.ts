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

import { createJsonRpcTransport } from "../../../jsonrpc/ws/mod.ts";

import type { Strawman } from "../../../strawman-core/application/strawman.ts";
import type { ILogger } from "../../../strawman-logger/mod.ts";

import { createRcServer } from "../../../strawman-rc/mod.ts";

export const makeHandleRemoteControlConnection = (
  deps: { strawman: Strawman; logger: ILogger },
) => {
  const handleRemoteControlConnection = (requestEvent: Deno.RequestEvent) => {
    const { socket, response } = Deno.upgradeWebSocket(requestEvent.request);

    socket.addEventListener("open", () => {
      deps.logger.info(
        "A remote control client has been connected to Strawman.",
      );
    });

    socket.addEventListener("close", () => {
      deps.logger.info(
        "A remote control client has been disconnected from Strawman.",
      );
    });

    const transport = createJsonRpcTransport({ socket });
    const server = createRcServer({
      strawman: deps.strawman,
      logger: deps.logger,
    });

    server.run(transport);

    requestEvent.respondWith(response);
  };

  return handleRemoteControlConnection;
};
