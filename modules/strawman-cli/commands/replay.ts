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

import { parse } from "../../../deps/flags.ts";

import { castError } from "../../framework/castError.ts";
import { logError } from "../../framework/logError.ts";
import { Exception } from "../../framework/exception.ts";

import {
  IReplayRequest,
  makeReplayRequest,
} from "../../strawman-core/application/replayRequest.ts";
import { Node } from "../../strawman-core/domain/model/Node.ts";
import { makeImportTemplate } from "../../strawman-core/infrastructure/fs/importTemplate.ts";
import { makeCreateVirtualServiceTreeFromDirectory } from "../../strawman-core/infrastructure/fs/createVirtualServiceTreeFromDirectory.ts";

export const shortDescription = "Strawman replays captured responses";

export const helpMessage = `
Usage:
  strawman replay [...options]

Options:
  -l, --local-root-uri  The local URI that strawman is running on (defaults 
                        to: http://localhost:8080)
  -s, --snapshot-dir    The directory that captured snaphots should be 
                        saved in (defaults to: ./snapshots)

Examples:
  strawman replay
  strawman replay -l http://localhost:3000
  strawman replay -s ./path/to/snapshots
`;

type CommandParameters = {
  theLocalRootUri: URL;
  thePathToSnapshotDirectory: string;
};

export const run = async () => {
  const parameters = parseParametersFromCliArguments(Deno.args);
  const virtualServiceTree = await initializeVirtualServiceTree(parameters);

  await startReplayServer({
    ...parameters,
    aVirtualServiceTree: virtualServiceTree,
  });
};

const parseParametersFromCliArguments = (args: string[]): CommandParameters => {
  const { _, ...options } = parse(args);

  return {
    theLocalRootUri: new URL(
      options.l ?? options["local-root-uri"] ?? "http://localhost:8080",
    ),
    thePathToSnapshotDirectory: options.s ?? options["snapshot-dir"] ??
      "./snapshots",
  };
};

const initializeVirtualServiceTree = async (given: CommandParameters) => {
  const createVirtualServiceTreeFromDirectory =
    makeCreateVirtualServiceTreeFromDirectory({
      importTemplate: makeImportTemplate({
        import: (pathToScriptFile) => import(pathToScriptFile),
        timer: Date.now,
      }),
    });

  try {
    return await createVirtualServiceTreeFromDirectory(
      given.thePathToSnapshotDirectory,
    );
  } catch (err) {
    console.error(
      `[☓] Virtual Service Tree could not be created`,
    );
    logError(castError(err));
    Deno.exit(1);
  }
};

const startReplayServer = async (
  given: CommandParameters & { aVirtualServiceTree: Node },
) => {
  const replayRequest = makeReplayRequest({
    pathToDirectory: given.thePathToSnapshotDirectory,
    isEditingEnabled: true,
    virtualServiceTree: given.aVirtualServiceTree,
    subscribers: [],
  });
  const server = Deno.listen({
    port: parseInt(given.theLocalRootUri.port ?? "8080", 10),
  });

  console.info(`[⚐] Strawman is listening at ${given.theLocalRootUri}`);

  for await (const connection of server) {
    serveHttp({
      ...given,
      aConnection: connection,
      aReplayRequesthandler: replayRequest,
    });
  }
};

const serveHttp = async (
  given: CommandParameters & {
    aConnection: Deno.Conn;
    aReplayRequesthandler: IReplayRequest;
  },
) => {
  const http = Deno.serveHttp(given.aConnection);

  for await (const requestEvent of http) {
    console.info(
      `[➘] [${requestEvent.request.method}] ${
        new URL(requestEvent.request.url).pathname
      }`,
    );

    try {
      const response = await given.aReplayRequesthandler({
        aRequest: requestEvent.request,
      });

      requestEvent.respondWith(response).then(() => {
        console.info(
          `[➚] [${requestEvent.request.method}] [${response.status}] ${
            new URL(requestEvent.request.url).pathname
          }`,
        );
      });
    } catch (err) {
      const error = castError(err);

      if (error instanceof Exception && error.code === 1641473907) {
        requestEvent.respondWith(
          new Response(error.message, {
            status: 404,
          }),
        );
      } else {
        requestEvent.respondWith(
          new Response(error.message, {
            status: 500,
          }),
        );
      }

      console.error(
        `[☓] [${requestEvent.request.method}] ${
          new URL(requestEvent.request.url).pathname
        }`,
      );
      logError(error);
    }
  }
};
