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

import { exists } from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";
import Yargs from "https://deno.land/x/yargs/deno.ts";
import { Arguments } from "https://deno.land/x/yargs/deno-types.ts";

import { responseFromSnapshot } from "./responseFromSnapshot.ts";

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
      const prefix = new URL(argv.prefix);
      const target = new URL(argv.target);
      const output = argv.outputDir as string;

      const server = Deno.listen({ port: parseInt(prefix.port ?? "80", 10) });

      console.info(`Strawman is listening at ${prefix}`);

      for await (const connection of server) {
        const http = Deno.serveHttp(connection);

        for await (const requestEvent of http) {
          const requestUrl = new URL(requestEvent.request.url);
          const targetUrl = new URL(target.toString());
          targetUrl.pathname = requestUrl.pathname;

          const snapshotFilename = path.join(
            output,
            requestUrl.pathname,
            `${requestEvent.request.method}.mock`
          );

          if (await exists(snapshotFilename)) {
            const snapshot = await Deno.readTextFile(snapshotFilename);
            requestEvent.respondWith(responseFromSnapshot(snapshot));
          } else {
            Deno.mkdir(path.dirname(snapshotFilename), { recursive: true });
            const response = await fetch(targetUrl.toString());
            const snapshot = `
${[...response.headers.entries()]
  .map(([key, value]) => `${key}: ${value}`)
  .join("\n")}

${await response.clone().text()}
`.trim();

            await Deno.writeTextFile(snapshotFilename, snapshot);

            requestEvent.respondWith(response);
          }
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
      const prefix = new URL(argv.prefix);
      const output = argv.outputDir as string;

      const server = Deno.listen({ port: parseInt(prefix.port ?? "80", 10) });

      console.info(`Strawman is listening at ${prefix}`);

      for await (const connection of server) {
        const http = Deno.serveHttp(connection);

        for await (const requestEvent of http) {
          const requestUrl = new URL(requestEvent.request.url);
          const snapshotFilename = path.join(
            output,
            requestUrl.pathname,
            `${requestEvent.request.method}.mock`
          );

          try {
            const snapshot = await Deno.readTextFile(snapshotFilename);
            requestEvent.respondWith(responseFromSnapshot(snapshot));
          } catch (_err) {
            requestEvent.respondWith(
              new Response("Not found", { status: 404 })
            );
          }
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
