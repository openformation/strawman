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

import { NodeName } from "./NodeName.ts";
import { NodePath } from "./NodePath.ts";
import { HTTPMethod } from "./HTTPMethod.ts";
import { Snapshot } from "./Snapshot.ts";

export class Node {
  private constructor(
    private readonly props: {
      name: null | NodeName;
      snapshots: Record<string, Snapshot>;
      children: Record<string, Node>;
    }
  ) {}

  public static readonly root = () =>
    new Node({
      name: null,
      snapshots: {},
      children: {},
    });

  public static readonly withName = (name: NodeName) =>
    new Node({
      name,
      snapshots: {},
      children: {},
    });

  public readonly getSnapshotForHTTPMethod = (httpMethod: HTTPMethod) =>
    this.props.snapshots[httpMethod.toString()] ?? null;

  public readonly withAddedSnapshot = (
    httpMethod: HTTPMethod,
    snapshot: Snapshot
  ) =>
    new Node({
      ...this.props,
      snapshots: { ...this.props.snapshots, [httpMethod.toString()]: snapshot },
    });

  public readonly getChild = (name: NodeName) =>
    this.props.children[name.toString()] ?? null;

  public readonly withAddedChild = (addedChild: Node) => {
    if (addedChild.props.name === null) {
      AddChildConstraint["`addedChildNode` must not be root"]();
    }

    return new Node({
      ...this.props,
      children: {
        ...this.props.children,
        [addedChild.props.name!.toString()]: addedChild,
      },
    });
  };

  public readonly traverse = (
    callback: (nodePath: NodePath, node: Node) => void
  ) => {
    const doTraverse = (node: Node, nodePath: NodePath) => {
      callback(nodePath, node);

      for (const [name, childNode] of Object.entries(node.props.children)) {
        doTraverse(
          childNode,
          nodePath.withAppendedSegment(NodeName.fromString(name))
        );
      }
    };

    doTraverse(this, NodePath.fromNodeName(this.props.name));
  };
}

export class AddChildConstraint extends Error {
  private constructor(reason: string) {
    super(`ChildNode could not be added, because ${reason}`);
  }

  public static readonly ["`addedChildNode` must not be root"] = () => {
    throw new AddChildConstraint(`\`addedChildNode\` must not be root`);
  };
}
