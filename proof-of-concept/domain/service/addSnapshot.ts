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

import type { EventBus } from "../../framework/createEventBus.ts";

import { Event, EventType } from "../event.ts";
import { Node } from "../model/Node.ts";
import { NodePath } from "../model/NodePath.ts";
import { HTTPMethod } from "../model/HTTPMethod.ts";
import { Snapshot } from "../model/Snapshot.ts";
import { Template } from "../model/Template.ts";

export const makeAddSnapshot =
  (deps: { eventBus: EventBus<Event> }) =>
  (
    aRootNode: Node,
    aPath: string,
    anHTTPMethod: HTTPMethod,
    aSnapShot: Snapshot
  ) => {
    const nodePath = NodePath.fromString(aPath);
    const ancestors = [aRootNode];
    const newNodes = new Set<Node>();
    const addedNodes = new Set<Node>();

    let node = aRootNode;
    for (const nodeName of nodePath) {
      node = node.getChild(nodeName);
      if (node === null) {
        node = Node.withName(nodeName);
        newNodes.add(node);
      }

      ancestors.push(node);
    }

    const snapShotParentIsNew = newNodes.has(node);

    newNodes.delete(node);
    ancestors.pop();
    node = node.withAddedTemplate(
      anHTTPMethod,
      Template.fromSnapshot(aSnapShot)
    );

    if (snapShotParentIsNew) newNodes.add(node);
    ancestors.push(node);

    const nextRootNode = ancestors.reduceRight((childNode, parentNode) => {
      if (childNode === null) {
        if (newNodes.has(parentNode)) {
          addedNodes.add(parentNode);
        }
        return parentNode;
      }

      const nextParentNode = parentNode.withAddedChild(childNode);

      if (newNodes.has(parentNode)) {
        addedNodes.add(nextParentNode);
      }

      return nextParentNode;
    }, null as null | Node)!;

    for (const node of addedNodes) {
      deps.eventBus.dispatch({
        type: EventType.NODE_WAS_ADDED,
        payload: { tree: nextRootNode, nodePath, node },
      });
    }

    deps.eventBus.dispatch({
      type: EventType.SNAPSHOT_WAS_ADDED,
      payload: {
        tree: nextRootNode,
        nodePath,
        node,
        httpMethod: anHTTPMethod,
        snapshot: aSnapShot,
      },
    });

    return nextRootNode;
  };
