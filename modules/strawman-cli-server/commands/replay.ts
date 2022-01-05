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

import { failure, success } from "../../framework/result.ts";

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

  const result = await createVirtualServiceTreeFromDirectory(
    given.thePathToSnapshotDirectory,
  );

  for (const { value: virtualServiceTree } of success(result)) {
    return virtualServiceTree;
  }

  for (const error of failure(result)) {
    switch (error.type) {
      default:
      case "ERROR: Directory could not be read":
        console.error(
          `[☓] Directory "${given.thePathToSnapshotDirectory}" could not be read`,
        );
        break;
      case "ERROR: Template could not be imported":
        console.error(
          `[☓] Virtual Service Tree could not be created: Template could not be imported`,
        );
        break;
    }
  }

  Deno.exit(1);
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
      aReplayRequesthandler: replayRequest
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

    const captureRequestResult = await given.aReplayRequesthandler({
      aRequest: requestEvent.request,
    });

    for (const { value: response } of success(captureRequestResult)) {
      requestEvent.respondWith(response).then(() => {
        console.info(
          `[➚] [${requestEvent.request.method}] [${response.status}] ${
            new URL(requestEvent.request.url).pathname
          }`,
        );
      });
    }

    for (const error of failure(captureRequestResult)) {
      console.error(
        `[☓] [${requestEvent.request.method}] ${
          new URL(requestEvent.request.url).pathname
        }`,
      );

      switch (error.type) {
        default:
        case "ERROR: Template was not found": {
          console.error("  → Template was not found");
          requestEvent.respondWith(error.value);
        }
      }
    }
  }
};
