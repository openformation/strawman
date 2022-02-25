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

import type { Strawman } from "../../../strawman-core/application/strawman.ts";
import type { ILogger } from "../../../strawman-logger/mod.ts";

export const makeHandleProxyRequest = (
  deps: { strawman: Strawman; logger: ILogger },
) => {
  const handleProxyRequest = async (requestEvent: Deno.RequestEvent) => {
    deps.logger.incoming("Received request", { request: requestEvent.request });

    try {
      const { request } = requestEvent;
      const response = await deps.strawman.handleRequest(request);

      requestEvent.respondWith(response).then(() => {
        deps.logger.outgoing("Response was sent", {
          request,
          response,
        });
      });
    } catch (unknown) {
      const error = castError(unknown);

      deps.logger.error(error, { request: requestEvent.request });
      requestEvent.respondWith(new Response(error.message, { status: 500 }));
    }
  };

  return handleProxyRequest;
};
