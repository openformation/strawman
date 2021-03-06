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

import { castError } from "../../framework/castError.ts";

import { ILogger } from "../../strawman-logger/mod.ts";

import { fileExists } from "./fileExists.ts";

export const makeCreateSnapshotDirectoryIfNotExists = (
  deps: { logger: ILogger },
) => {
  const createSnapshotDirectoryIfNotExists = async (
    pathToSnapshotDirectory: string,
  ) => {
    try {
      if (await fileExists(pathToSnapshotDirectory)) {
        deps.logger.debug(
          `Directory "${pathToSnapshotDirectory}" exists and won't be created`,
        );
      } else {
        await Deno.mkdir(pathToSnapshotDirectory, { recursive: true });
        deps.logger.info(`Directory "${pathToSnapshotDirectory}" was created`);
      }
    } catch (err) {
      deps.logger.fatal(
        new Error(
          `Directory "${pathToSnapshotDirectory}" could not be created`,
          { cause: castError(err) },
        ),
      );
      Deno.exit(1);
    }
  };

  return createSnapshotDirectoryIfNotExists;
};
