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

import {
  assertStrictEquals,
  assertThrows,
} from "https://deno.land/std/testing/asserts.ts";

import { Pathname } from "./Pathname.ts";
import { HTTPMethod } from "./HTTPMethod.ts";
import { Snapshot } from "./Snapshot.ts";
import { VirtualServiceTreeNode } from "./VirtualServiceTreeNode.ts";

Deno.test({
  name: "`VirtualServiceTreeNode` can be created from Pathname",
  fn: () => {
    const pathname = Pathname.fromString("/some/path/name");
    const node = VirtualServiceTreeNode.fromPathname(pathname);

    assertStrictEquals(node.name, "name");
    assertStrictEquals(node.parentPath, Pathname.fromString("/some/path"));
  },
});

Deno.test({
  name: "`VirtualServiceTreeNode` knows of itself whether it is a root node or not",
  fn: () => {
    assertStrictEquals(Pathname.fromString("/some/path/name").isRoot, false);
    assertStrictEquals(Pathname.fromString("/").isRoot, true);
  },
});

Deno.test({
  name: "`VirtualServiceTreeNode` can contain snapshots",
  fn: async () => {
    const pathname = Pathname.fromString("/some/path/name");
    const snapshot = await Snapshot.fromFetchResponse(
      new Response(JSON.stringify({ hello: "world" }), {
        headers: {
          "content-type": "application/json; charset=UTF-8",
        },
      })
    );
    const node = VirtualServiceTreeNode.fromPathname(
      pathname
    ).withAddedSnapshot(HTTPMethod.GET, snapshot);

    assertStrictEquals(node.getSnapShotForHTTPMethod(HTTPMethod.GET), snapshot);
  },
});

Deno.test({
  name: "`VirtualServiceTreeNode.getSnapShotForHTTPMethod` returns null for unknown snapshots",
  fn: () => {
    const pathname = Pathname.fromString("/some/path/name");
    const node = VirtualServiceTreeNode.fromPathname(pathname);

    assertStrictEquals(node.getSnapShotForHTTPMethod(HTTPMethod.GET), null);
  },
});

Deno.test({
  name: "`VirtualServiceTreeNode` can have children",
  fn: () => {
    const child1 = VirtualServiceTreeNode.fromPathname(
      Pathname.fromString("/some/path/name/child1")
    );
    const child2 = VirtualServiceTreeNode.fromPathname(
      Pathname.fromString("/some/path/name/child2")
    );
    const child3 = VirtualServiceTreeNode.fromPathname(
      Pathname.fromString("/some/path/name/child3")
    );
    const node = VirtualServiceTreeNode.fromPathname(
      Pathname.fromString("/some/path/name")
    ).withAddedChildren([child1, child2, child3]);

    assertStrictEquals(node.getChild("child1"), child1);
    assertStrictEquals(node.getChild("child2"), child2);
    assertStrictEquals(node.getChild("child3"), child3);
  },
});

Deno.test({
  name: "`VirtualServiceTreeNode.getChild` returns null for unknown children",
  fn: () => {
    const pathname = Pathname.fromString("/some/path/name");
    const node = VirtualServiceTreeNode.fromPathname(pathname);

    assertStrictEquals(node.getChild("someChild"), null);
  },
});

Deno.test({
  name: "`VirtualServiceTreeNode` only accepts valid children",
  fn: () => {
    const invalidBecauseItsAnIndirectDescendant =
      VirtualServiceTreeNode.fromPathname(
        Pathname.fromString("/some/path/name/sub/child1")
      );
    const invalidBecauseItsAndAncestor = VirtualServiceTreeNode.fromPathname(
      Pathname.fromString("/some/path")
    );
    const invalidBecauseItsCompletelyUnrelated =
      VirtualServiceTreeNode.fromPathname(
        Pathname.fromString("/other/path/name/child1")
      );
    const node = VirtualServiceTreeNode.fromPathname(
      Pathname.fromString("/some/path/name")
    );

    assertThrows(
      () => node.withAddedChildren([invalidBecauseItsAnIndirectDescendant]),
      undefined,
      undefined,
      "`VirtualServiceTreeNode` does not accept indirect descendants as children"
    );
    assertThrows(
      () => node.withAddedChildren([invalidBecauseItsAndAncestor]),
      undefined,
      undefined,
      "`VirtualServiceTreeNode` does not accept ancestors as children"
    );
    assertThrows(
      () => node.withAddedChildren([invalidBecauseItsCompletelyUnrelated]),
      undefined,
      undefined,
      "`VirtualServiceTreeNode` does not accept completely unrelated nodes as children"
    );
  },
});
