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

import * as path from "../../../deps/path.ts";

import { VERSION } from "../../../version.ts";

import { castError } from "../../framework/castError.ts";

import { ILogger } from "../../strawman-logger/mod.ts";

const manifestTemplate =
  `import type { Manifest } from "https://deno.land/x/strawman@${VERSION}/mod.ts";

export const manifest: Manifest = {
};
`;

export const makeCreateManifestFile = (
  deps: { logger: ILogger },
) => {
  const createManifestFile = async (pathToSnapshotDirectory: string) => {
    const pathToManifestFile = path.join(
      pathToSnapshotDirectory,
      "manifest.ts",
    );

    try {
      await Deno.writeTextFile(pathToManifestFile, manifestTemplate);
      deps.logger.info(`Manifest file "${pathToManifestFile}" was written`);
    } catch (err) {
      deps.logger.fatal(
        new Error(
          `Manifest file "${pathToManifestFile}" could not be written`,
          { cause: castError(err) },
        ),
      );
      Deno.exit(1);
    }
  };

  return createManifestFile;
};
