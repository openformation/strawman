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

import {
  ICaptureRequest,
  makeCaptureRequest,
} from "../../strawman-core/application/captureRequest.ts";
import { Node } from "../../strawman-core/domain/model/Node.ts";
import { makeImportTemplate } from "../../strawman-core/infrastructure/fs/importTemplate.ts";
import { makeCreateVirtualServiceTreeFromDirectory } from "../../strawman-core/infrastructure/fs/createVirtualServiceTreeFromDirectory.ts";
import { makeSaveVirtualServiceTreeToDirectory } from "../../strawman-core/infrastructure/fs/saveVirtualServiceTreeToDirectory.ts";

export const shortDescription =
  "Strawman acts as a proxy and captures responses from a remote web service";

export const helpMessage = `
Usage:
  strawman capture [...options] <remote-root-uri>

Options:
  -l, --local-root-uri  The local URI that strawman is running on (defaults 
                        to: http://localhost:8080)
  -s, --snapshot-dir    The directory that captured snaphots should be saved 
                        in. Strawman will attempt to create this directory if
                        it does not exist yet. (defaults to: ./snapshots)

Examples:
  strawman capture https://example.com
  strawman capture -l http://localhost:3000 https://example.com
  strawman capture -s ./path/to/snapshots https://example.com
`;

type CommandParameters = {
  theRemoteRootUri: URL;
  theLocalRootUri: URL;
  thePathToSnapshotDirectory: string;
};

export const run = async () => {
  const parameters = parseParametersFromCliArguments(Deno.args);
  const virtualServiceTree = await initializeVirtualServiceTree(parameters);

  await startCaptureServer({
    ...parameters,
    aVirtualServiceTree: virtualServiceTree,
  });
};

const parseParametersFromCliArguments = (args: string[]): CommandParameters => {
  const { _: positional, ...options } = parse(args);
  if (!positional[1]) {
    console.error("ERROR: <remote-root-uri> must be provided.");
    console.log("");
    console.log(helpMessage);
    Deno.exit(1);
  }

  return {
    theRemoteRootUri: new URL(
      args[1] as string,
    ),
    theLocalRootUri: new URL(
      options.l ?? options["local-root-uri"] ?? "http://localhost:8080",
    ),
    thePathToSnapshotDirectory: options.s ?? options["snapshot-dir"] ??
      "./snapshots",
  };
};

const createSnapshotDirectoryIfNotExists = async (given: CommandParameters) => {
  try {
    await Deno.mkdir(given.thePathToSnapshotDirectory, { recursive: true });
  } catch (err) {
    console.error(
      `[☓] Directory "${given.thePathToSnapshotDirectory}" could not be created`,
    );
    logError(castError(err));
    Deno.exit(1);
  }
};

const initializeVirtualServiceTree = async (given: CommandParameters) => {
  const createVirtualServiceTreeFromDirectory =
    makeCreateVirtualServiceTreeFromDirectory({
      importTemplate: makeImportTemplate({
        import: (pathToScriptFile) => import(pathToScriptFile),
        timer: Date.now,
      }),
    });

  await createSnapshotDirectoryIfNotExists(given);

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

const startCaptureServer = async (
  given: CommandParameters & { aVirtualServiceTree: Node },
) => {
  const saveVirtualServiceTreeToDirectory =
    makeSaveVirtualServiceTreeToDirectory({
      pathToDirectory: given.thePathToSnapshotDirectory,
    });
  const captureRequest = makeCaptureRequest({
    urlOfProxiedService: given.theRemoteRootUri,
    virtualServiceTree: given.aVirtualServiceTree,
    subscribers: [saveVirtualServiceTreeToDirectory],
  });

  const server = Deno.listen({
    port: parseInt(given.theLocalRootUri.port ?? "8080", 10),
  });

  console.info(`[⚐] Strawman is listening at ${given.theLocalRootUri}`);

  for await (const connection of server) {
    serveHttp({
      ...given,
      aConnection: connection,
      aCaptureRequestHandler: captureRequest,
    });
  }
};

const serveHttp = async (
  given: CommandParameters & {
    aConnection: Deno.Conn;
    aCaptureRequestHandler: ICaptureRequest;
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
      const response = await given.aCaptureRequestHandler({
        aRequest: requestEvent.request,
      });

      requestEvent.respondWith(response).then(() => {
        console.info(
          `[➚] [${requestEvent.request.method}] [${response.status}] ${
            new URL(requestEvent.request.url).pathname
          }`,
        );
        console.info("  → Template was written");
      });
    } catch (err) {
      const error = castError(err);

      console.error(
        `[☓] [${requestEvent.request.method}] ${
          new URL(requestEvent.request.url).pathname
        }`,
      );
      logError(error);

      requestEvent.respondWith(new Response(error.message, { status: 500 }));
    }
  }
};
