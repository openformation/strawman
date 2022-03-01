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

import { assertResponseEquals } from "../../../../deps-dev/asserts.ts";
import { assertSpyCall, spy } from "../../../../deps-dev/mock.ts";

import { createEventBus } from "../../../framework/createEventBus.ts";

import { DomainEvent } from "../events/DomainEvent.ts";
import { HTTPMethod } from "../model/HTTPMethod.ts";
import { PathSegment } from "../model/PathSegment.ts";
import { NodePath } from "../model/NodePath.ts";
import { Node } from "../model/Node.ts";
import { Snapshot } from "../model/Snapshot.ts";

import { makeAddSnapshot } from "./addSnapshot.ts";

Deno.test({
  name: "`addSnapshot` can add snapshots to the root node",
  fn: async () => {
    const eventBus = createEventBus<DomainEvent>();
    const addSnapshot = makeAddSnapshot({ eventBus });

    const rootNode = Node.blank();
    const snapshot = await Snapshot.fromFetchResponse(
      new Response(JSON.stringify({ foo: "bar" }), {
        status: 200,
        statusText: "OK",
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    const nextRootNode = addSnapshot({
      aRootNode: rootNode,
      aPath: NodePath.root,
      anHTTPMethod: HTTPMethod.GET,
      aSnapShot: snapshot,
    });

    await assertResponseEquals(
      await nextRootNode
        .getTemplateForHTTPMethod(HTTPMethod.GET)
        .generateResponse(new Request("https://example.com"), {}),
      snapshot.toFetchResponse(),
    );
  },
});

Deno.test({
  name:
    "`addSnapshot` can add snapshots to nodes at deeper levels, creating non-existent ancestors along the way",
  fn: async () => {
    const eventBus = createEventBus<DomainEvent>();
    const addSnapshot = makeAddSnapshot({ eventBus });

    const rootNode = Node.blank();
    const snapshot = await Snapshot.fromFetchResponse(
      new Response(JSON.stringify({ foo: "bar" }), {
        status: 200,
        statusText: "OK",
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    const nextRootNode = addSnapshot({
      aRootNode: rootNode,
      aPath: NodePath.fromString("/some/deep/path"),
      anHTTPMethod: HTTPMethod.GET,
      aSnapShot: snapshot,
    });

    await assertResponseEquals(
      await nextRootNode
        .getChild(PathSegment.fromString("some"))
        ?.getChild(PathSegment.fromString("deep"))
        ?.getChild(PathSegment.fromString("path"))
        ?.getTemplateForHTTPMethod(HTTPMethod.GET)
        .generateResponse(new Request("https://example.com"), {})!,
      snapshot.toFetchResponse(),
    );
  },
});

Deno.test({
  name: "`addSnapshot` emits a SnapshotWasAddedEvent",
  fn: async () => {
    const eventBus = createEventBus<DomainEvent>();
    const subscriber = spy();

    const addSnapshot = makeAddSnapshot({ eventBus });

    const rootNode = Node.blank();
    const snapshot = await Snapshot.fromFetchResponse(
      new Response(JSON.stringify({ foo: "bar" }), {
        status: 200,
        statusText: "OK",
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    eventBus.subscribe(subscriber);

    const nextRootNode = addSnapshot({
      aRootNode: rootNode,
      aPath: NodePath.root,
      anHTTPMethod: HTTPMethod.GET,
      aSnapShot: snapshot,
    });

    assertSpyCall(subscriber, 0, {
      args: [
        DomainEvent.SnapshotWasAdded({
          rootNode: nextRootNode,
          path: NodePath.root,
          parentNode: nextRootNode,
          httpMethod: HTTPMethod.GET,
          addedSnaphot: snapshot,
        }),
      ],
    });
  },
});

Deno.test({
  name:
    "`addSnapshot` emits NodeWasAdded events for every node that's created along the way",
  fn: async () => {
    const eventBus = createEventBus<DomainEvent>();
    let x: null | DomainEvent = null;
    const subscriber = spy((event: DomainEvent) => {
      x = x ?? event;
    });

    const addSnapshot = makeAddSnapshot({ eventBus });

    const rootNode = Node.blank();
    const snapshot = await Snapshot.fromFetchResponse(
      new Response(JSON.stringify({ foo: "bar" }), {
        status: 200,
        statusText: "OK",
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    eventBus.subscribe(subscriber);

    const nextRootNode = addSnapshot({
      aRootNode: rootNode,
      aPath: NodePath.fromString("/some/deep/path"),
      anHTTPMethod: HTTPMethod.GET,
      aSnapShot: snapshot,
    });

    assertSpyCall(subscriber, 0, {
      args: [
        DomainEvent.NodeWasAdded({
          rootNode: nextRootNode,
          path: NodePath.fromString("/some"),
          addedNode: nextRootNode.getChild(PathSegment.fromString("some"))!,
        }),
      ],
    });
    assertSpyCall(subscriber, 1, {
      args: [
        DomainEvent.NodeWasAdded({
          rootNode: nextRootNode,
          path: NodePath.fromString("/some/deep"),
          addedNode: nextRootNode
            .getChild(PathSegment.fromString("some"))
            ?.getChild(PathSegment.fromString("deep"))!,
        }),
      ],
    });
    assertSpyCall(subscriber, 2, {
      args: [
        DomainEvent.NodeWasAdded({
          rootNode: nextRootNode,
          path: NodePath.fromString("/some/deep/path"),
          addedNode: nextRootNode
            .getChild(PathSegment.fromString("some"))
            ?.getChild(PathSegment.fromString("deep"))
            ?.getChild(PathSegment.fromString("path"))!,
        }),
      ],
    });
  },
});
