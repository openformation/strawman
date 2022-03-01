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
 */

import * as path from "../../../../deps/path.ts";

import { Ref } from "../../../framework/createRef.ts";

import { Path } from "../../domain/model/Path.ts";
import { Node } from "../../domain/model/Node.ts";
import { HTTPMethod } from "../../domain/model/HTTPMethod.ts";
import { IModifyTemplate } from "../../domain/service/modifyTemplate.ts";

import { IImportTemplate } from "./importTemplate.ts";

export const makeWatchForChanges = (deps: {
  pathToDirectory: string;
  virtualServiceTreeRef: Ref<Node>;
  modifyTemplate: IModifyTemplate;
  importTemplate: IImportTemplate;
}) => {
  const watchForChanges = () => {
    const watcher = Deno.watchFs(deps.pathToDirectory);
    doWatchForChanges(watcher);
    return () => watcher.close();
  };

  const runningHandlers = new Set<string>();
  const doWatchForChanges = async (watcher: Deno.FsWatcher) => {
    for await (const event of watcher) handleEvent(event);
  };
  const handleEvent = async (event: Deno.FsEvent) => {
    if (event.kind !== "modify") return;

    const paths = event.paths.filter((p) => p.endsWith(".mock.ts"));
    if (paths.length === 0) return;

    const serializedEvent = JSON.stringify(event);
    if (runningHandlers.has(serializedEvent)) return;
    runningHandlers.add(serializedEvent);

    for (const filePath of paths) {
      const relativePath = path.relative(deps.pathToDirectory, filePath);
      const dirname = path.dirname(relativePath);
      const basename = path.basename(relativePath, ".mock.ts");

      try {
        const template = await deps.importTemplate(filePath);
        if (deps.virtualServiceTreeRef.current !== null) {
          deps.virtualServiceTreeRef.current = deps.modifyTemplate({
            aRootNode: deps.virtualServiceTreeRef.current,
            aPath: Path.fromString(dirname === "." ? "/" : `/${dirname}`),
            anHTTPMethod: HTTPMethod.fromString(basename),
            theModifiedTemplate: template,
          });
        }
      } catch (err) {
        console.error(err);
      }
    }

    setTimeout(() => runningHandlers.delete(serializedEvent), 20);
  };

  return watchForChanges;
};
