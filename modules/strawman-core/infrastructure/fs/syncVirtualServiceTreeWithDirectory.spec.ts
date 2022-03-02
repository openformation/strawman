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

import { assert, assertEquals } from "../../../../deps-dev/asserts.ts";
import * as path from "../../../../deps/path.ts";

import { createEventBus } from "../../../framework/createEventBus.ts";

import { DomainEvent } from "../../domain/events/DomainEvent.ts";
import { HTTPMethod } from "../../domain/model/HTTPMethod.ts";
import { NodeName } from "../../domain/model/NodeName.ts";
import { NodePath } from "../../domain/model/NodePath.ts";
import { Node } from "../../domain/model/Node.ts";
import { Snapshot } from "../../domain/model/Snapshot.ts";

import { makeSyncVirtualServiceTreeWithDirectory } from "./syncVirtualServiceTreeWithDirectory.ts";

Deno.test("`saveVirtualServiceTreeToDirectory`", async (t) => {
  const pathToDirectory = path.join(
    path.dirname(path.fromFileUrl(import.meta.url)),
    "__tmp__",
  );
  await Deno.mkdir(pathToDirectory, { recursive: true });

  const saveVirtualServiceTreeToDirectory =
    makeSyncVirtualServiceTreeWithDirectory({
      pathToDirectory,
    });

  await t.step(
    "it creates a new directory when `NodeWasAdded` occurs",
    async () => {
      const eventBus = createEventBus<DomainEvent>();
      const addedNode = Node.blank();
      const rootNode = Node.blank().withAddedChild(
        NodeName.fromString("some-child"),
        addedNode,
      );

      eventBus.subscribe(saveVirtualServiceTreeToDirectory);
      eventBus.dispatch(
        DomainEvent.NodeWasAdded({
          rootNode,
          path: NodePath.fromString("/some-child"),
          addedNode,
        }),
      );

      await new Promise((resolve) => setTimeout(resolve, 500));

      assert(
        (await Deno.stat(path.join(pathToDirectory, "some-child"))).isDirectory,
      );
    },
  );

  await t.step(
    "it creates a template script when `SnapshotWasAdded` occurs",
    async () => {
      const eventBus = createEventBus<DomainEvent>();
      const parentNode = Node.blank();
      const rootNode = Node.blank().withAddedChild(
        NodeName.fromString("some-child"),
        parentNode,
      );

      eventBus.subscribe(saveVirtualServiceTreeToDirectory);
      eventBus.dispatch(
        DomainEvent.SnapshotWasAdded({
          rootNode,
          path: NodePath.fromString("/some-child"),
          httpMethod: HTTPMethod.GET,
          parentNode,
          addedSnaphot: await Snapshot.fromFetchResponse(
            new Response(JSON.stringify({ foo: "bar" }), {
              status: 404,
              statusText: "Not Found",
              headers: {
                "content-type": "application/json",
              },
            }),
          ),
        }),
      );

      await new Promise((resolve) => setTimeout(resolve, 500));

      assertEquals(
        await Deno.readTextFile(
          path.join(pathToDirectory, "some-child/GET.mock.ts"),
        ),
        `
export default (req: Request) => {
  return response(req);
};

const response = (_req: Request) => \`
404 Not Found

content-type: application/json

{"foo":"bar"}
\`;
`.trim(),
      );
    },
  );

  await Deno.remove(pathToDirectory, { recursive: true });
});
