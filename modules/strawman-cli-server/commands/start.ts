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

import { makeModifyTemplate } from "../../strawman-core/domain/service/modifyTemplate.ts";

import { makeImportTemplate } from "../../strawman-core/infrastructure/fs/importTemplate.ts";
import { makeCreateVirtualServiceTreeFromDirectory } from "../../strawman-core/infrastructure/fs/createVirtualServiceTreeFromDirectory.ts";
import { makeSaveVirtualServiceTreeToDirectory } from "../../strawman-core/infrastructure/fs/saveVirtualServiceTreeToDirectory.ts";

import { makeWatchForChanges } from "../../strawman-core/infrastructure/fs/watchForChanges.ts";

import { makeStrawman } from "../../strawman-core/application/strawman.ts";

export const shortDescription =
  "Start a strawman server to simulate or capture HTTP responses of a remote service";

export const helpMessage = `
Usage:
  strawman start [...options] <remote-root-uri>

Options:
  -m, --mode            "replay" or "capture" - defines how strawman handles
                        incoming requests. 
                        "capture" will forward the request to the remote 
                        service and capture its response. 
                        "replay" will answer with a previously captured 
                        response.
                        (defaults to: "replay")
  -l, --local-root-uri  The local URI that strawman is running on (defaults 
                        to: http://localhost:8080)
  -s, --snapshot-dir    The directory that captured snaphots should be saved 
                        in. Strawman will attempt to create this directory if
                        it does not exist yet. (defaults to: ./snapshots)
  -e, --enable-editing  Strawman will watch for changes in the snapshot 
                        directory and update the its service virtualization
                        accordingly

Examples:
  strawman capture https://example.com
  strawman capture -l http://localhost:3000 https://example.com
  strawman capture -s ./path/to/snapshots https://example.com
`;

type CommandParameters = {
  theMode: "replay" | "capture";
  theRemoteRootUri: URL;
  theLocalRootUri: URL;
  thePathToSnapshotDirectory: string;
  isEditingEnabled: boolean;
};

export const run = async () => {
  const parameters = parseParametersFromCliArguments(Deno.args);
  const virtualServiceTree = await initializeVirtualServiceTree(parameters);
  const saveVirtualServiceTreeToDirectory =
    makeSaveVirtualServiceTreeToDirectory({
      pathToDirectory: parameters.thePathToSnapshotDirectory,
    });
  const strawman = makeStrawman({
    urlOfProxiedService: parameters.theRemoteRootUri,
    virtualServiceTree,
    subscribers: [saveVirtualServiceTreeToDirectory],
  });

  strawman.setMode(parameters.theMode);

  if (parameters.isEditingEnabled) {
    const watchForChanges = makeWatchForChanges({
      pathToDirectory: parameters.thePathToSnapshotDirectory,
      modifyTemplate: makeModifyTemplate({ eventBus: strawman.eventBus }),
      importTemplate: makeImportTemplate({
        import: (pathToTemplateFile) => import(pathToTemplateFile),
        timer: Date.now,
      }),
      virtualServiceTreeRef: strawman.virtualServiceTreeRef,
    });

    watchForChanges();
  }

  await startHttpServer({
    theLocalRootUri: parameters.theLocalRootUri,
    aRequestHandler: strawman.handleRequest,
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
    theMode: options.m ?? options["mode"] ?? "replay",
    theRemoteRootUri: new URL(positional[1] as string),
    theLocalRootUri: new URL(
      options.l ?? options["local-root-uri"] ?? "http://localhost:8080",
    ),
    thePathToSnapshotDirectory: options.s ?? options["snapshot-dir"] ??
      "./snapshots",
    isEditingEnabled: Boolean(options.e || options["enable-editing"]),
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

async function startHttpServer(given: {
  theLocalRootUri: URL;
  aRequestHandler: (request: Request) => Promise<Response>;
}) {
  const server = Deno.listen({
    port: parseInt(given.theLocalRootUri.port ?? "8080", 10),
  });

  console.info(`[⚐] Strawman is listening at ${given.theLocalRootUri}`);

  for await (const connection of server) {
    serveHttp({
      aConnection: connection,
      aRequestHandler: given.aRequestHandler,
    });
  }
}

async function serveHttp(given: {
  aConnection: Deno.Conn;
  aRequestHandler: (request: Request) => Promise<Response>;
}) {
  const http = Deno.serveHttp(given.aConnection);

  for await (const requestEvent of http) {
    console.info(
      `[➘] [${requestEvent.request.method}] ${
        new URL(requestEvent.request.url).pathname
      }`,
    );

    try {
      const response = await given.aRequestHandler(requestEvent.request);

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
}
