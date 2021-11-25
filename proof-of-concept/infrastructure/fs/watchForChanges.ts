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

import * as path from "https://deno.land/std/path/mod.ts";

import type { EventBus } from "../../framework/createEventBus.ts";

import { Event } from "../../domain/event.ts";
import { Node } from "../../domain/model/Node.ts";
import { HTTPMethod } from "../../domain/model/HTTPMethod.ts";
import { makeModifyTemplate } from "../../domain/service/modifyTemplate.ts";

import { importTemplate } from "./importTemplate.ts";

export const makeWatchForChanges = (deps: {
  pathToDirectory: string;
  eventBus: EventBus<Event>;
  onUpdate: (newVirtualServiceTree: Node) => void | Promise<void>;
}) => {
  const modifyTemplate = makeModifyTemplate({ eventBus: deps.eventBus });

  return async (getVirtualServiceTree: () => null | Node) => {
    const watcher = Deno.watchFs(deps.pathToDirectory);
    for await (const event of watcher) {
      if (event.kind !== "modify") continue;

      const paths = event.paths.filter((p) => p.endsWith(".mock.ts"));
      if (paths.length === 0) continue;

      for (const filePath of paths) {
        const relativePath = path.relative(deps.pathToDirectory, filePath);
        const dirname = path.dirname(relativePath);
        const basename = path.basename(relativePath, ".mock.ts");

        try {
          const template = await importTemplate(filePath);
          const virttualServiceTree = getVirtualServiceTree();
          if (virttualServiceTree) {
            deps.onUpdate(
              modifyTemplate(
                virttualServiceTree,
                `/${dirname}`,
                HTTPMethod.fromString(basename),
                template
              )
            );
          }
        } finally {
          //
        }
      }
    }
  };
};
