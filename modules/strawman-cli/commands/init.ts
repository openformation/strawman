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

import { createLogger, createLogPrinter } from "../../strawman-logger/mod.ts";

import { makeCreateSnapshotDirectoryIfNotExists } from "../lib/createSnapshotDirectoryIfNotExists.ts";
import { makeCreateManifestFile } from "../lib/createManifestFile.ts";

export const shortDescription = "Initialize a snapshot directory";

export const helpMessage = `
Usage:
  strawman init

Options:
  -s, --snapshot-dir    The directory that captured snaphots should be saved 
                        in. Strawman will attempt to create this directory if
                        it does not exist yet. (defaults to: ./snapshots)

Examples:
  strawman init -s ./path/to/snapshots
`;

type CommandParameters = {
  thePathToSnapshotDirectory: string;
};

export const run = async () => {
  const parameters = parseParametersFromCliArguments(Deno.args);
  const logger = createLogger();
  const logPrinter = createLogPrinter();

  const createSnapshotDirectoryIfNotExists =
    makeCreateSnapshotDirectoryIfNotExists({
      logger,
    });
  const createManifestFile = makeCreateManifestFile({
    logger,
  });

  logger.subscribe(logPrinter);

  await createSnapshotDirectoryIfNotExists(
    parameters.thePathToSnapshotDirectory,
  );
  await createManifestFile(parameters.thePathToSnapshotDirectory);
};

const parseParametersFromCliArguments = (args: string[]): CommandParameters => {
  const { _, ...options } = parse(args);

  return {
    thePathToSnapshotDirectory: options.s ?? options["snapshot-dir"] ??
      "./snapshots",
  };
};
