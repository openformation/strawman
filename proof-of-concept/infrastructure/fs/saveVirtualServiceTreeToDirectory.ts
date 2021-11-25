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

import { createSubscription } from "../../framework/createSubscription.ts";
import { createJobQueue } from "../../framework/createJobQueue.ts";

import { Event, EventType } from "../../domain/event.ts";

export const makeSaveVirtualServiceTreeToDirectory = (deps: {
  pathToDirectory: string;
}) => {
  const jobQueue = createJobQueue();

  return createSubscription<Event>()
    .on(EventType.NODE_WAS_ADDED, (ev) => {
      const pathToNodeDirectory = path.join(
        deps.pathToDirectory,
        ev.payload.nodePath.toString()
      );

      jobQueue.addJob(() =>
        Deno.mkdir(pathToNodeDirectory, { recursive: true })
      );
    })
    .on(EventType.NODE_WAS_REMOVED, (ev) => {
      const pathToNodeDirectory = path.join(
        deps.pathToDirectory,
        ev.payload.nodePath.toString()
      );

      jobQueue.addJob(() =>
        Deno.remove(pathToNodeDirectory, { recursive: true })
      );
    })
    .on(EventType.SNAPSHOT_WAS_ADDED, (ev) => {
      const pathToTemplateFile = path.join(
        deps.pathToDirectory,
        ev.payload.nodePath.toString(),
        `${ev.payload.httpMethod.toString()}.mock.ts`
      );

      jobQueue.addJob(() =>
        Deno.writeTextFile(
          pathToTemplateFile,
          [
            "export default (_req: Request) => `",
            ev.payload.snapshot.toString(),
            "`;",
          ].join("\n")
        )
      );
    });
};
