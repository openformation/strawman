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

import { assertStrictEquals } from "https://deno.land/std/testing/asserts.ts";

import { Pathname } from "./Pathname.ts";
import { VirtualServiceTreeNode } from "./VirtualServiceTreeNode.ts";
import { VirtualServiceTree } from "./VirtualServiceTree.ts";

Deno.test({
  name: "`VirtualServiceTree` can create an blank instance of itself",
  fn: () => {
    const tree = VirtualServiceTree.blank();

    assertStrictEquals(tree.props.rootNode.parentPath, null);
  },
});

Deno.test({
  name: "New nodes can be added to `VirtualServiceTree`",
  fn: () => {
    const newNode1 = VirtualServiceTreeNode.fromPathname(
      Pathname.fromString("/new-1")
    );
    const newNode2 = VirtualServiceTreeNode.fromPathname(
      Pathname.fromString("/new-2")
    );
    const tree = VirtualServiceTree.blank().withAddedNodes([
      newNode1,
      newNode2,
    ]);

    assertStrictEquals(tree.hasNode(newNode1), true);
    assertStrictEquals(tree.hasNode(newNode2), true);

    assertStrictEquals(tree.props.rootNode.getChild("new-1"), newNode1);
    assertStrictEquals(tree.props.rootNode.getChild("new-2"), newNode2);
  },
});

Deno.test({
  name: "New nodes of any depth can be added to `VirtualServiceTree`, while missing levels will be added on the fly",
  fn: () => {
    const newNode1 = VirtualServiceTreeNode.fromPathname(
      Pathname.fromString("/level-1/level-2/new-1")
    );
    const newNode2 = VirtualServiceTreeNode.fromPathname(
      Pathname.fromString("/level-3/level-4/level-5/new-2")
    );
    const tree = VirtualServiceTree.blank().withAddedNodes([
      newNode1,
      newNode2,
    ]);

    assertStrictEquals(tree.hasNode(newNode1), true);
    assertStrictEquals(tree.hasNode(newNode2), true);

    assertStrictEquals(
      tree.hasNode(tree.props.rootNode.getChild("level-1")!),
      true
    );
    assertStrictEquals(
      tree.hasNode(
        tree.props.rootNode.getChild("level-1")?.getChild("level-2")!
      ),
      true
    );
    assertStrictEquals(
      tree.hasNode(tree.props.rootNode.getChild("level-3")!),
      true
    );
    assertStrictEquals(
      tree.hasNode(
        tree.props.rootNode.getChild("level-3")?.getChild("level-4")!
      ),
      true
    );
    assertStrictEquals(
      tree.hasNode(
        tree.props.rootNode
          .getChild("level-3")
          ?.getChild("level-4")
          ?.getChild("level-5")!
      ),
      true
    );

    assertStrictEquals(
      tree.props.rootNode
        .getChild("level-1")
        ?.getChild("level-2")
        ?.getChild("new-1"),
      newNode1
    );
    assertStrictEquals(
      tree.props.rootNode
        .getChild("level-3")
        ?.getChild("level-4")
        ?.getChild("level-5")
        ?.getChild("new-2"),
      newNode2
    );
  },
});
