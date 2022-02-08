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

import { makeImportTemplate } from "../../strawman-core/infrastructure/fs/importTemplate.ts";
import { makeCreateVirtualServiceTreeFromDirectory } from "../../strawman-core/infrastructure/fs/createVirtualServiceTreeFromDirectory.ts";

import { makeCreateSnapshotDirectoryIfNotExists } from "./createSnapshotDirectoryIfNotExists.ts";

export const makeInitializeVirtualServiceTree = (deps: {
  logger: ILogger;
}) => {
  const initializeVirtualServiceTree = async (
    pathToSnapshotDirectory: string,
  ) => {
    const createSnapshotDirectoryIfNotExists =
      makeCreateSnapshotDirectoryIfNotExists({
        logger: deps.logger,
      });
    const createVirtualServiceTreeFromDirectory =
      makeCreateVirtualServiceTreeFromDirectory({
        importTemplate: makeImportTemplate({
          import: (pathToScriptFile) => import(pathToScriptFile),
          timer: Date.now,
        }),
      });

    await createSnapshotDirectoryIfNotExists(pathToSnapshotDirectory);

    try {
      return await createVirtualServiceTreeFromDirectory(
        pathToSnapshotDirectory,
      );
    } catch (err) {
      deps.logger.fatal(
        new Error(`Virtual Service Tree could not be created`, {
          cause: castError(err),
        }),
      );
      Deno.exit(1);
    }
  };

  return initializeVirtualServiceTree;
};
