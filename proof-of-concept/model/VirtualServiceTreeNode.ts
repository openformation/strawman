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
import { HTTPMethod } from "./HTTPMethod.ts";
import { Snapshot } from "./Snapshot.ts";

export class VirtualServiceTreeNode {
  private constructor(
    private readonly props: {
      pathname: Pathname;
      snapshots: Map<HTTPMethod, Snapshot>;
      children: Map<Pathname, VirtualServiceTreeNode>;
    }
  ) {
    this.name = this.props.pathname.basename();
    this.isRoot = this.props.pathname.isRoot;
  }

  public static readonly fromPathname = (pathname: Pathname) =>
    new VirtualServiceTreeNode({
      pathname,
      snapshots: new Map(),
      children: new Map(),
    });

  public readonly name: null | string;

  public readonly isRoot: boolean;

  public get parentPath() {
    return this.props.pathname.parent();
  }

  public readonly withAddedSnapshot = (
    httpMethod: HTTPMethod,
    snapshot: Snapshot
  ) =>
    new VirtualServiceTreeNode({
      ...this.props,
      snapshots: new Map([
        ...this.props.snapshots.entries(),
        [httpMethod, snapshot],
      ]),
    });

  public readonly getSnapShotForHTTPMethod = (httpMethod: HTTPMethod) =>
    this.props.snapshots.get(httpMethod) ?? null;

  public readonly withAddedChildren = (
    addedChildren: VirtualServiceTreeNode[]
  ) => {
    assert(
      addedChildren.every((c) =>
        this.props.pathname.isParentOf(c.props.pathname)
      ),
      `\`addedChildren\` must all be direct children of "${this.props.pathname.props.value}"`
    );

    return new VirtualServiceTreeNode({
      ...this.props,
      children: new Map([
        ...this.props.children.entries(),
        ...addedChildren.map((child) => [child.props.pathname, child] as const),
      ]),
    });
  };

  public readonly getChild = (name: string) =>
    this.props.children.get(this.props.pathname.append(name)) ?? null;

  public readonly hasChild = (name: string) =>
    this.props.children.has(this.props.pathname.append(name));

  public readonly getDescendantAtPath = (
    pathname: Pathname
  ): null | VirtualServiceTreeNode => {
    if (this.props.pathname.isParentOf(pathname)) {
      return pathname.isRoot ? this : this.getChild(pathname.basename()!);
    }

    if (this.props.pathname.isAncestorOf(pathname)) {
      for (const [childPathname, child] of this.props.children) {
        if (childPathname.isAncestorOf(pathname)) {
          return child.getDescendantAtPath(pathname);
        }
      }
    }

    return null;
  };

  public readonly hasDescendantAtPath = (pathname: Pathname): boolean => {
    if (this.props.pathname.isParentOf(pathname)) {
      return this.hasChild(pathname.basename()!);
    }

    if (this.props.pathname.isAncestorOf(pathname)) {
      for (const [childPathname, child] of this.props.children) {
        if (childPathname.isAncestorOf(pathname)) {
          return child.hasDescendantAtPath(pathname);
        }
      }
    }

    return false;
  };

  public readonly hasDescendant = (node: VirtualServiceTreeNode) =>
    this.getDescendantAtPath(node.props.pathname) === node;
}
