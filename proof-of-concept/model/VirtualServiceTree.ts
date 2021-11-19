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

import { assert } from "https://deno.land/std/testing/asserts.ts";

import { Pathname } from "./Pathname.ts";
import { VirtualServiceTreeNode } from "./VirtualServiceTreeNode.ts";

export class VirtualServiceTree {
  private constructor(
    public readonly props: {
      rootNode: VirtualServiceTreeNode;
    }
  ) {
    assert(props.rootNode.isRoot, "`rootNode` must have pathname '/'");
  }

  public static readonly blank = () =>
    VirtualServiceTree.fromRootNode(
      VirtualServiceTreeNode.fromPathname(Pathname.fromString("/"))
    );

  public static readonly fromRootNode = (rootNode: VirtualServiceTreeNode) =>
    new VirtualServiceTree({
      rootNode,
    });

  public readonly withAddedNode = (
    addedNode: VirtualServiceTreeNode
  ): VirtualServiceTree => {
    const parentPath = addedNode.parentPath;
    if (parentPath) {
      const parentNode =
        this.props.rootNode.getDescendantAtPath(parentPath) ??
        VirtualServiceTreeNode.fromPathname(parentPath);
      return this.withAddedNode(parentNode.withAddedChildren([addedNode]));
    }

    return VirtualServiceTree.fromRootNode(addedNode);
  };

  public readonly withAddedNodes = (addedNodes: VirtualServiceTreeNode[]) =>
    addedNodes.reduce(
      (tree, addedNode) => tree.withAddedNode(addedNode),
      this as VirtualServiceTree
    );

  public readonly getNodeAtPath = (path: string) =>
    this.props.rootNode.getDescendantAtPath(Pathname.fromString(path));

  public readonly hasNodeAtPath = (path: string) =>
    this.props.rootNode.hasDescendantAtPath(Pathname.fromString(path));

  public readonly hasNode = (node: VirtualServiceTreeNode) =>
    this.props.rootNode.hasDescendant(node);
}
