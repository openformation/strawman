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

import type { Strawman } from "../../../strawman-core/application/strawman.ts";
import type { ILogger } from "../../../strawman-logger/mod.ts";

import { makeHandleRemoteControlConnection } from "./handleRemoteControlConnection.ts";
import { makeHandleProxyRequest } from "./handleProxyRequest.ts";

const STRAWMAN_RC_ENDPOINT = "/__strawman/rc";

export const makeServeHttp = (
  deps: { strawman: Strawman; logger: ILogger },
) => {
  const handleRemoteControlConnection = makeHandleRemoteControlConnection(deps);
  const handleProxyRequest = makeHandleProxyRequest(deps);

  const serveHttp = async (connection: Deno.Conn) => {
    for await (const requestEvent of Deno.serveHttp(connection)) {
      const url = new URL(requestEvent.request.url);

      if (url.pathname === STRAWMAN_RC_ENDPOINT) {
        handleRemoteControlConnection(requestEvent);
      } else {
        handleProxyRequest(requestEvent);
      }
    }
  };

  return serveHttp;
};
