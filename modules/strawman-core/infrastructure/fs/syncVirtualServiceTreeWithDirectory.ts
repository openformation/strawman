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

import { createSubscription } from "../../../framework/createSubscription.ts";
import { createJobQueue } from "../../../framework/createJobQueue.ts";

import { DomainEvent } from "../../domain/events/DomainEvent.ts";
import { sanitizeSnapshotContent } from "../../domain/service/sanitizeSnapshot.ts";

export const makeSyncVirtualServiceTreeWithDirectory = (deps: {
  pathToDirectory: string;
}) => {
  const jobQueue = createJobQueue();

  return createSubscription<DomainEvent>()
    .on("http://openformation.io/strawman/NodeWasAdded", (ev) => {
      const pathToNodeDirectory = path.join(
        deps.pathToDirectory,
        ev.payload.path.toString(),
      );

      jobQueue.addJob(() =>
        Deno.mkdir(pathToNodeDirectory, { recursive: true })
      );
    })
    .on("http://openformation.io/strawman/SnapshotWasAdded", (ev) => {
      const pathToTemplateFile = path.join(
        deps.pathToDirectory,
        ev.payload.path.toString(),
        `${ev.payload.httpMethod.toString()}.mock.ts`,
      );

      jobQueue.addJob(() =>
        Deno.writeTextFile(
          pathToTemplateFile,
          [
            "export default (req: Request) => {",
            "  return response(req);",
            "};",
            "",
            "const response = (_req: Request) => `",
            sanitizeSnapshotContent(ev.payload.addedSnaphot.toString()),
            "`;",
          ].join("\n"),
        )
      );
    })
    .on("http://openformation.io/strawman/TemplateWasDeleted", (ev) => {
      const pathToTemplateFile = path.join(
        deps.pathToDirectory,
        ev.payload.path.toString(),
        `${ev.payload.httpMethod.toString()}.mock.ts`,
      );

      jobQueue.addJob(() => Deno.remove(pathToTemplateFile));
    });
};
