/**
 * strawman - A Deno-based service virtualization solution
 * Copyright (C) 2021 Open Formation GmbH
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
 *
 */

import Yargs from "https://deno.land/x/yargs/deno.ts";
import { Arguments } from "https://deno.land/x/yargs/deno-types.ts";

import {
  createVirtualServiceTreeFromDirectory,
  makeSaveVirtualServiceTreeToDirectory,
} from "./infrastructure/fs/index.ts";
import { makeLogVirtualServiceTreeEvents } from "./infrastructure/log/index.ts";
import {
  makeCaptureRequest,
  makeReplayRequest,
  printServiceTree,
} from "./application/index.ts";

console.log(
  "███████╗████████╗██████╗  █████╗ ██╗    ██╗███╗   ███╗ █████╗ ███╗   ██╗"
);
console.log(
  "██╔════╝╚══██╔══╝██╔══██╗██╔══██╗██║    ██║████╗ ████║██╔══██╗████╗  ██║"
);
console.log(
  "███████╗   ██║   ██████╔╝███████║██║ █╗ ██║██╔████╔██║███████║██╔██╗ ██║"
);
console.log(
  "╚════██║   ██║   ██╔══██╗██╔══██║██║███╗██║██║╚██╔╝██║██╔══██║██║╚██╗██║"
);
console.log(
  "███████║   ██║   ██║  ██║██║  ██║╚███╔███╔╝██║ ╚═╝ ██║██║  ██║██║ ╚████║"
);
console.log(
  "╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝"
);
console.log("");
console.log("");

Yargs(Deno.args)
  .command(
    "capture <output-dir>",
    "strawman acts as a proxy and captures responses from the original request target",
    (yargs: ReturnType<typeof Yargs>) => {
      return yargs
        .option("prefix", {
          alias: "p",
          type: "string",
          description: "The host URL that strawman is running on",
        })
        .option("target", {
          alias: "t",
          type: "string",
          description:
            "The target URL that strawman should forward requests to",
        })
        .positional("output-dir", {
          describe: "The directory for saving snapshots",
        });
    },
    async (argv: Arguments) => {
      const strawmanServiceAddress = new URL(argv.prefix);
      const pathToOutputDirectory = argv.outputDir as string;
      const urlOfProxiedService = new URL(argv.target);
      const virtualServiceTree = await createVirtualServiceTreeFromDirectory(
        pathToOutputDirectory
      );
      const captureRequest = makeCaptureRequest({
        urlOfProxiedService,
        virtualServiceTree,
        subscribers: [
          makeSaveVirtualServiceTreeToDirectory({
            pathToDirectory: pathToOutputDirectory,
          }),
          makeLogVirtualServiceTreeEvents({
            logger: console,
          }),
        ],
      });

      printServiceTree(virtualServiceTree);

      const server = Deno.listen({
        port: parseInt(strawmanServiceAddress.port ?? "80", 10),
      });

      console.info(`Strawman is listening at ${strawmanServiceAddress}`);

      for await (const connection of server) {
        const http = Deno.serveHttp(connection);

        for await (const requestEvent of http) {
          requestEvent.respondWith(await captureRequest(requestEvent.request));
        }
      }
    }
  )
  .command(
    "replay <output-dir>",
    "strawman replays captured responses",
    (yargs: ReturnType<typeof Yargs>) => {
      return yargs
        .option("prefix", {
          alias: "p",
          type: "string",
          description: "The host URL that strawman is running on",
        })
        .positional("output-dir", {
          describe: "The directory for saving snapshots",
        });
    },
    async (argv: Arguments) => {
      const strawmanServiceAddress = new URL(argv.prefix);
      const pathToOutputDirectory = argv.outputDir as string;
      const replayRequest = makeReplayRequest({
        virtualServiceTree: await createVirtualServiceTreeFromDirectory(
          pathToOutputDirectory
        ),
      });

      const server = Deno.listen({
        port: parseInt(strawmanServiceAddress.port ?? "80", 10),
      });

      console.info(`Strawman is listening at ${strawmanServiceAddress}`);

      for await (const connection of server) {
        const http = Deno.serveHttp(connection);

        for await (const requestEvent of http) {
          requestEvent.respondWith(replayRequest(requestEvent.request));
        }
      }
    }
  )
  .option("verbose", {
    alias: "v",
    type: "boolean",
    description: "Run with verbose logging",
  })
  .strictCommands()
  .demandCommand(1)
  .parse();
