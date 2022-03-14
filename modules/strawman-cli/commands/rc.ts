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

import { runLogsCommand } from "../lib/rc/runLogsCommand.ts";
import { runDeleteCommand } from "../lib/rc/runDeleteCommand.ts";
import { runCaptureCommand } from "../lib/rc/runCaptureCommand.ts";
import { runReplayCommand } from "../lib/rc/runReplayCommand.ts";

export const shortDescription = "Remote control a running strawman server";

export const helpMessage = `
Usage:
  strawman rc [...options] <command> [...command-options]

Options:
  -l, --local-root-uri  The local URI that strawman is running on (defaults 
                        to: http://localhost:8080)

Commands:
  logs                     Displays logs from the running strawman server
  delete [method] [path]   Deletes the snapshot for the given http method at 
                           the given endpoint path
  mode                     Displays the current strawman mode
  replay                   Switches the strawman server to replay mode
  capture                  Switches the strawman server to capture mode

Examples:
  strawman rc logs
  strawman rc delete GET /some/endpoint
  strawman rc mode
  strawman rc replay
  strawman rc capture
`;

type CommandParameters =
  & { theLocalRootUri: URL }
  & (
    | { command: "logs" }
    | { command: "delete"; method: string; path: string }
    | { command: "mode" }
    | { command: "replay" }
    | { command: "capture" }
  );

export const run = () => {
  const params = parseParametersFromCliArguments(Deno.args);

  switch (params.command) {
    default:
    case "logs":
      return runLogsCommand(params.theLocalRootUri);

    case "delete":
      return runDeleteCommand(
        params.theLocalRootUri,
        params.method,
        params.path,
      );

    case "capture":
      return runCaptureCommand(params.theLocalRootUri);

    case "replay":
      return runReplayCommand(params.theLocalRootUri);
  }
};

const parseParametersFromCliArguments = (args: string[]): CommandParameters => {
  const { _: positional, ...options } = parse(args);
  const [, command] = positional;

  if (!positional[1]) {
    console.error("ERROR: <command> must be provided.");
    console.log("");
    console.log(helpMessage);
    Deno.exit(1);
  }

  const theLocalRootUri = new URL(
    options.l ?? options["local-root-uri"] ?? "http://localhost:8080",
  );

  switch (command) {
    case "delete": {
      const [, , method, path] = positional;

      if (!method) {
        console.error("ERROR: [method] must be provided.");
        console.log("");
        console.log(helpMessage);
        Deno.exit(1);
      }

      if (!path) {
        console.error("ERROR: [path] must be provided.");
        console.log("");
        console.log(helpMessage);
        Deno.exit(1);
      }

      return {
        theLocalRootUri,
        command,
        method: String(method),
        path: String(path),
      };
    }

    case "logs":
    case "mode":
    case "replay":
    case "capture":
      return { theLocalRootUri, command };

    default:
      console.error(`ERROR: Unknown rc command "${command}"`);
      console.log("");
      console.log(helpMessage);
      Deno.exit(1);
  }
};
