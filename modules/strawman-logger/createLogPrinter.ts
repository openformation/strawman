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

import { createSubscription } from "../framework/createSubscription.ts";

import { LogEvent } from "./LogEvent.ts";
import { ErrorDTO } from "./ErrorDTO.ts";
import { createOutputStream, OutputStream } from "./createOutputStream.ts";

export const createLogPrinter = (options?: {
  stream?: {
    info?: Deno.WriterSync;
    incoming?: Deno.WriterSync;
    outgoing?: Deno.WriterSync;
    warning?: Deno.WriterSync;
    error?: Deno.WriterSync;
    fatal?: Deno.WriterSync;
    debug?: Deno.WriterSync;
  };
}) => {
  const stream = Object.freeze({
    info: createOutputStream(options?.stream?.info ?? Deno.stdout),
    incoming: createOutputStream(options?.stream?.incoming ?? Deno.stdout),
    outgoing: createOutputStream(options?.stream?.outgoing ?? Deno.stdout),
    warning: createOutputStream(options?.stream?.warning ?? Deno.stderr),
    error: createOutputStream(options?.stream?.error ?? Deno.stderr),
    fatal: createOutputStream(options?.stream?.fatal ?? Deno.stderr),
    debug: createOutputStream(options?.stream?.debug ?? Deno.stderr),
  });

  return createSubscription<LogEvent>()
    .on("http://openformation.io/strawman-logger/LogInfo", (event) => {
      stream.info.println(`[⚐] ${event.payload.message}`);
    })
    .on(
      "http://openformation.io/strawman-logger/LogIncoming",
      (event) => {
        stream.incoming.println(
          `[➘] [${event.payload.request.method}] ${
            new URL(event.payload.request.url).pathname
          }`,
        );

        const [firstLine, ...lines] = event.payload.message.split("\n");

        stream.incoming.println(`  → ${firstLine}`);

        for (const line of lines) {
          stream.incoming.println(`    ${line}`);
        }
      },
    )
    .on(
      "http://openformation.io/strawman-logger/LogOutgoing",
      (event) => {
        stream.outgoing.println(
          `[➚] [${event.payload.request.method}] [${event.payload.response.status}] ${
            new URL(event.payload.request.url).pathname
          }`,
        );

        const [firstLine, ...lines] = event.payload.message.split("\n");

        stream.outgoing.println(`  → ${firstLine}`);

        for (const line of lines) {
          stream.outgoing.println(`    ${line}`);
        }
      },
    )
    .on(
      "http://openformation.io/strawman-logger/LogWarning",
      (event) => {
        stream.warning.println(`[⚠] ${event.payload.message}`);
      },
    )
    .on(
      "http://openformation.io/strawman-logger/LogError",
      (event) => {
        const printErrorDTORecursively = makePrintErrorDTORecursively({
          stream: stream.error,
        });

        if (event.payload.request) {
          stream.error.println(
            `[☓] [${event.payload.request.method}] ${
              new URL(event.payload.request.url).pathname
            }`,
          );
        } else {
          stream.error.println(`[☓] An error occurred:`);
        }

        printErrorDTORecursively(event.payload.error, 1);
      },
    )
    .on(
      "http://openformation.io/strawman-logger/LogFatal",
      (event) => {
        const printErrorDTORecursively = makePrintErrorDTORecursively({
          stream: stream.fatal,
        });

        stream.fatal.println("!".repeat(80));
        stream.fatal.println("");

        if (event.payload.request) {
          stream.fatal.println(
            `[FATAL] [${event.payload.request.method}] ${
              new URL(event.payload.request.url).pathname
            }`,
          );
        } else {
          stream.fatal.println(`[FATAL]: `);
        }

        printErrorDTORecursively(event.payload.error, 1);

        stream.fatal.println("");
        stream.fatal.println("!".repeat(80));
      },
    )
    .on(
      "http://openformation.io/strawman-logger/LogDebug",
      (event) => {
        const [firstLine, ...lines] = event.payload.message.split("\n");

        stream.debug.println(`[🚧] ${firstLine}`);
        for (const line of lines) {
          stream.debug.println(`    ${line}`);
        }
      },
    );
};

const makePrintErrorDTORecursively = (deps: { stream: OutputStream }) => {
  const printErrorDTORecursively = (
    dto: ErrorDTO,
    indentation: number,
  ) => {
    deps.stream.println(
      `${"  ".repeat(indentation)}→ ${dto.message}`,
    );

    if (dto.cause) {
      printErrorDTORecursively(dto.cause, indentation + 1);
    } else {
      dto.trace.forEach(
        (line) => {
          deps.stream.println(`${"  ".repeat(indentation)}   ${line}`);
        },
      );
    }
  };

  return printErrorDTORecursively;
};
