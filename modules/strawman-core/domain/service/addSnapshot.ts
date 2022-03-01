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

import type { EventBus } from "../../../framework/createEventBus.ts";

import { DomainEvent } from "../events/DomainEvent.ts";
import { PathSegment } from "../model/PathSegment.ts";
import { Path } from "../model/Path.ts";
import { Node } from "../model/Node.ts";
import { HTTPMethod } from "../model/HTTPMethod.ts";
import { Snapshot } from "../model/Snapshot.ts";
import { Template } from "../model/Template.ts";

export const makeAddSnapshot = (deps: { eventBus: EventBus<DomainEvent> }) => {
  const addSnapshot = (given: {
    aRootNode: Node;
    aPath: Path;
    anHTTPMethod: HTTPMethod;
    aSnapShot: Snapshot;
  }) => {
    if (given.aPath === Path.root) {
      const nextRootNode = given.aRootNode.withTemplateForHTTPMethod(
        given.anHTTPMethod,
        Template.fromSnapshot(given.aSnapShot),
      );

      deps.eventBus.dispatch(
        DomainEvent.SnapshotWasAdded({
          rootNode: nextRootNode,
          path: given.aPath,
          parentNode: nextRootNode,
          httpMethod: given.anHTTPMethod,
          addedSnaphot: given.aSnapShot,
        }),
      );

      return nextRootNode;
    }

    const theHTTPMethod = given.anHTTPMethod;
    const theSnapshot = given.aSnapShot;

    let theParentNode: null | Node = null;
    const createdNodes: { path: Path; node: Node }[] = [];
    const addSnapshotRecursively = (given: {
      aParentPath: Path;
      aParentNode: Node;
      remainingPathSegments: PathSegment[];
    }): Node => {
      const [head, ...tail] = given.remainingPathSegments;
      const path = given.aParentPath.append(head);

      let node = given.aParentNode.getChild(head);
      const nodeNeededToBeCreated = node === null;

      if (tail.length) {
        node = addSnapshotRecursively({
          aParentPath: path,
          aParentNode: node ?? Node.blank(),
          remainingPathSegments: tail,
        });
      } else {
        node = (node ?? Node.blank()).withTemplateForHTTPMethod(
          theHTTPMethod,
          Template.fromSnapshot(theSnapshot),
        );

        theParentNode = node;
      }

      if (nodeNeededToBeCreated) {
        createdNodes.push({
          path,
          node,
        });
      }

      return given.aParentNode.withAddedChild(head, node!);
    };

    const nextRootNode = addSnapshotRecursively({
      aParentPath: Path.root,
      aParentNode: given.aRootNode,
      remainingPathSegments: [...given.aPath],
    });

    for (const { path, node: addedNode } of createdNodes.reverse()) {
      deps.eventBus.dispatch(
        DomainEvent.NodeWasAdded({
          rootNode: nextRootNode,
          path,
          addedNode,
        }),
      );
    }

    deps.eventBus.dispatch(
      DomainEvent.SnapshotWasAdded({
        rootNode: nextRootNode,
        path: given.aPath,
        parentNode: theParentNode!,
        httpMethod: given.anHTTPMethod,
        addedSnaphot: given.aSnapShot,
      }),
    );

    return nextRootNode;
  };

  return addSnapshot;
};
