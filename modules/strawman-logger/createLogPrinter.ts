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
import { createOutputFromWriter, Output } from "./createOutput.ts";

export const createLogPrinter = (options?: {
  output?: {
    default?: Output;
    info?: Output;
    incoming?: Output;
    outgoing?: Output;
    warning?: Output;
    error?: Output;
    fatal?: Output;
    debug?: Output;
  };
}) => {
  const output = Object.freeze({
    info: options?.output?.info ?? options?.output?.default ??
      createOutputFromWriter(Deno.stdout),
    incoming: options?.output?.incoming ?? options?.output?.default ??
      createOutputFromWriter(Deno.stdout),
    outgoing: options?.output?.outgoing ?? options?.output?.default ??
      createOutputFromWriter(Deno.stdout),
    warning: options?.output?.warning ?? options?.output?.default ??
      createOutputFromWriter(Deno.stderr),
    error: options?.output?.error ?? options?.output?.default ??
      createOutputFromWriter(Deno.stderr),
    fatal: options?.output?.fatal ?? options?.output?.default ??
      createOutputFromWriter(Deno.stderr),
    debug: options?.output?.debug ?? options?.output?.default ??
      createOutputFromWriter(Deno.stderr),
  });

  return createSubscription<LogEvent>()
    .on("http://openformation.io/strawman-logger/LogInfo", (event) => {
      output.info.println(`[⚐] ${event.payload.message}`);
    })
    .on(
      "http://openformation.io/strawman-logger/LogIncoming",
      (event) => {
        output.incoming.println(
          `[➘] [${event.payload.request.method}] ${
            new URL(event.payload.request.url).pathname
          }`,
        );

        const [firstLine, ...lines] = event.payload.message.split("\n");

        output.incoming.println(`  → ${firstLine}`);

        for (const line of lines) {
          output.incoming.println(`    ${line}`);
        }
      },
    )
    .on(
      "http://openformation.io/strawman-logger/LogOutgoing",
      (event) => {
        output.outgoing.println(
          `[➚] [${event.payload.request.method}] [${event.payload.response.status}] ${
            new URL(event.payload.request.url).pathname
          }`,
        );

        const [firstLine, ...lines] = event.payload.message.split("\n");

        output.outgoing.println(`  → ${firstLine}`);

        for (const line of lines) {
          output.outgoing.println(`    ${line}`);
        }
      },
    )
    .on(
      "http://openformation.io/strawman-logger/LogWarning",
      (event) => {
        output.warning.println(`[⚠] ${event.payload.message}`);
      },
    )
    .on(
      "http://openformation.io/strawman-logger/LogError",
      (event) => {
        const printErrorDTORecursively = makePrintErrorDTORecursively({
          output: output.error,
        });

        if (event.payload.request) {
          output.error.println(
            `[☓] [${event.payload.request.method}] ${
              new URL(event.payload.request.url).pathname
            }`,
          );
        } else {
          output.error.println(`[☓] An error occurred:`);
        }

        printErrorDTORecursively(event.payload.error, 1);
      },
    )
    .on(
      "http://openformation.io/strawman-logger/LogFatal",
      (event) => {
        const printErrorDTORecursively = makePrintErrorDTORecursively({
          output: output.fatal,
        });

        output.fatal.println("!".repeat(80));
        output.fatal.println("");

        if (event.payload.request) {
          output.fatal.println(
            `[FATAL] [${event.payload.request.method}] ${
              new URL(event.payload.request.url).pathname
            }`,
          );
        } else {
          output.fatal.println(`[FATAL]: `);
        }

        printErrorDTORecursively(event.payload.error, 1);

        output.fatal.println("");
        output.fatal.println("!".repeat(80));
      },
    )
    .on(
      "http://openformation.io/strawman-logger/LogDebug",
      (event) => {
        const [firstLine, ...lines] = event.payload.message.split("\n");

        output.debug.println(`[🚧] ${firstLine}`);
        for (const line of lines) {
          output.debug.println(`    ${line}`);
        }
      },
    );
};

const makePrintErrorDTORecursively = (deps: { output: Output }) => {
  const printErrorDTORecursively = (
    dto: ErrorDTO,
    indentation: number,
  ) => {
    deps.output.println(
      `${"  ".repeat(indentation)}→ ${dto.message}`,
    );

    if (dto.cause) {
      printErrorDTORecursively(dto.cause, indentation + 1);
    } else {
      dto.trace.forEach(
        (line) => {
          deps.output.println(`${"  ".repeat(indentation)}   ${line}`);
        },
      );
    }
  };

  return printErrorDTORecursively;
};
