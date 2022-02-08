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

import { castError } from "../../framework/castError.ts";

import { ILogger } from "../../strawman-logger/mod.ts";

export const makeStartHttpServer = (deps: { logger: ILogger }) => {
  const startHttpServer = async (given: {
    theLocalRootUri: URL;
    aRequestHandler: (request: Request) => Promise<Response>;
  }) => {
    const server = Deno.listen({
      port: parseInt(given.theLocalRootUri.port ?? "8080", 10),
    });

    deps.logger.info(`Strawman is listening at ${given.theLocalRootUri}`);

    for await (const connection of server) {
      serveHttp({
        aConnection: connection,
        aRequestHandler: given.aRequestHandler,
      });
    }
  };

  const serveHttp = async (given: {
    aConnection: Deno.Conn;
    aRequestHandler: (request: Request) => Promise<Response>;
  }) => {
    const http = Deno.serveHttp(given.aConnection);

    for await (const requestEvent of http) {
      deps.logger.incoming("Received request", {
        request: requestEvent.request,
      });

      try {
        const response = await given.aRequestHandler(requestEvent.request);

        requestEvent.respondWith(response).then(() => {
          deps.logger.outgoing("Response was sent", {
            request: requestEvent.request,
            response,
          });
        });
      } catch (err) {
        const error = castError(err);

        deps.logger.error(error, { request: requestEvent.request });

        requestEvent.respondWith(new Response(error.message, { status: 500 }));
      }
    }
  };

  return startHttpServer;
};
