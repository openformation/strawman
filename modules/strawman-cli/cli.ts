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

import { parse } from "../../deps/flags.ts";

import { VERSION } from "../../version.ts";

import * as capture from "./commands/capture.ts";
import * as replay from "./commands/replay.ts";

const commands = {
  capture,
  replay,
} as const;

const header = `
███████╗████████╗██████╗  █████╗ ██╗    ██╗███╗   ███╗ █████╗ ███╗   ██╗
██╔════╝╚══██╔══╝██╔══██╗██╔══██╗██║    ██║████╗ ████║██╔══██╗████╗  ██║
███████╗   ██║   ██████╔╝███████║██║ █╗ ██║██╔████╔██║███████║██╔██╗ ██║
╚════██║   ██║   ██╔══██╗██╔══██║██║███╗██║██║╚██╔╝██║██╔══██║██║╚██╗██║
███████║   ██║   ██║  ██║██║  ██║╚███╔███╔╝██║ ╚═╝ ██║██║  ██║██║ ╚████║
╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝

Strawman Server ${VERSION}`;

const helpMessage = `
Bugs: https://github.com/openformation/strawman/issues

Usage:
  strawman <command> [...options]

Commands:
  ${
  Object.entries(commands).map(([name, { shortDescription }]) =>
    `${name.padEnd(10)}${shortDescription}`
  )
    .join("\n  ")
}

Options:
  -v, --version  Prints version number
  -h, --help     Prints help message    

Made with ❤ by Open Formation GmbH
`;

function main() {
  const { _: args, ...options } = parse(Deno.args);

  if (options.v) {
    console.log(`Strawman Server v${VERSION}`);
    Deno.exit(0);
  }

  if (options.version) {
    const { deno, v8, typescript } = Deno.version;
    console.log([
      `Strawman Server v${VERSION}`,
      `deno ${deno}`,
      `v8 ${v8}`,
      `typescript ${typescript}`,
    ].join("\n"));
    Deno.exit(0);
  }

  if (args.length === 0 || !(args[0] in commands)) {
    console.log(header);
    console.log(helpMessage);
    Deno.exit(0);
  }

  const command = String(args.shift()) as keyof typeof commands;

  if (options.h || options.help) {
    console.log(header);
    console.log("");
    console.log(`Command: ${command}`);
    console.log("=".repeat(`Command: ${command}`.length));
    console.log("");
    console.log(commands[command].shortDescription);
    console.log(commands[command].helpMessage);
    Deno.exit(0);
  }

  console.log(header);
  console.log("");
  commands[command].run();
}

if (import.meta.main) {
  main();
}
