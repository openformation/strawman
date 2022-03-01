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

import { assertEquals, assertThrows } from "../../../../deps-dev/asserts.ts";
import { assertSpyCall, spy } from "../../../../deps-dev/mock.ts";

import { createEventBus } from "../../../framework/createEventBus.ts";

import { DomainEvent } from "../events/DomainEvent.ts";
import { HTTPMethod } from "../model/HTTPMethod.ts";
import { Template } from "../model/Template.ts";
import { PathSegment } from "../model/PathSegment.ts";
import { NodePath } from "../model/NodePath.ts";
import { Node } from "../model/Node.ts";

import { makeModifyTemplate } from "./modifyTemplate.ts";

const rootTemplate = Template.withCallback(() => "");
const level1Template = Template.withCallback(() => "");
const level2Template = Template.withCallback(() => "");
const level3Template = Template.withCallback(() => "");
const tree = Node.blank()
  .withAddedChild(PathSegment.fromString("level-1-1"), Node.blank())
  .withAddedChild(
    PathSegment.fromString("level-1-2"),
    Node.blank()
      .withAddedChild(
        PathSegment.fromString("level-2-1"),
        Node.blank().withTemplateForHTTPMethod(HTTPMethod.POST, level2Template),
      )
      .withAddedChild(PathSegment.fromString("level-2-2"), Node.blank())
      .withAddedChild(
        PathSegment.fromString("level-2-3"),
        Node.blank().withAddedChild(
          PathSegment.fromString("level-3-1"),
          Node.blank().withTemplateForHTTPMethod(
            HTTPMethod.DELETE,
            level3Template,
          ),
        ),
      ),
  )
  .withAddedChild(
    PathSegment.fromString("level-1-3"),
    Node.blank().withTemplateForHTTPMethod(HTTPMethod.GET, level1Template),
  )
  .withTemplateForHTTPMethod(HTTPMethod.PATCH, rootTemplate);

Deno.test({
  name:
    "`modifyTemplate` modifies known templates at any level of a virtual service tree",
  fn: () => {
    const eventBus = createEventBus<DomainEvent>();
    const modifyTemplate = makeModifyTemplate({ eventBus });
    const modifiedTemplate = Template.withCallback(() => "");

    let nextTree = modifyTemplate({
      aRootNode: tree,
      aPath: NodePath.fromString("/"),
      anHTTPMethod: HTTPMethod.PATCH,
      theModifiedTemplate: modifiedTemplate,
    });

    assertEquals(
      nextTree.getTemplateForHTTPMethod(HTTPMethod.PATCH),
      modifiedTemplate,
    );

    nextTree = modifyTemplate({
      aRootNode: tree,
      aPath: NodePath.fromString("/level-1-3"),
      anHTTPMethod: HTTPMethod.GET,
      theModifiedTemplate: modifiedTemplate,
    });

    assertEquals(
      nextTree
        .getChild(PathSegment.fromString("level-1-3"))
        ?.getTemplateForHTTPMethod(HTTPMethod.GET),
      modifiedTemplate,
    );

    nextTree = modifyTemplate({
      aRootNode: tree,
      aPath: NodePath.fromString("/level-1-2/level-2-1"),
      anHTTPMethod: HTTPMethod.POST,
      theModifiedTemplate: modifiedTemplate,
    });

    assertEquals(
      nextTree
        .getChild(PathSegment.fromString("level-1-2"))
        ?.getChild(PathSegment.fromString("level-2-1"))
        ?.getTemplateForHTTPMethod(HTTPMethod.POST),
      modifiedTemplate,
    );

    nextTree = modifyTemplate({
      aRootNode: tree,
      aPath: NodePath.fromString("/level-1-2/level-2-3/level-3-1"),
      anHTTPMethod: HTTPMethod.DELETE,
      theModifiedTemplate: modifiedTemplate,
    });

    assertEquals(
      nextTree
        .getChild(PathSegment.fromString("level-1-2"))
        ?.getChild(PathSegment.fromString("level-2-3"))
        ?.getChild(PathSegment.fromString("level-3-1"))
        ?.getTemplateForHTTPMethod(HTTPMethod.DELETE),
      modifiedTemplate,
    );
  },
});

Deno.test({
  name:
    "`modifyTemplate` throws if a template cannot be found at the given path",
  fn: () => {
    const eventBus = createEventBus<DomainEvent>();
    const modifyTemplate = makeModifyTemplate({ eventBus });

    assertThrows(() =>
      modifyTemplate({
        aRootNode: tree,
        aPath: NodePath.fromString("/level-1-2/un/known"),
        anHTTPMethod: HTTPMethod.DELETE,
        theModifiedTemplate: Template.withCallback(() => ""),
      })
    );
  },
});

Deno.test({
  name:
    "`modifyTemplate` throws if a template cannot be found for the given HTTPMethod",
  fn: () => {
    const eventBus = createEventBus<DomainEvent>();
    const modifyTemplate = makeModifyTemplate({ eventBus });

    assertThrows(() =>
      modifyTemplate({
        aRootNode: tree,
        aPath: NodePath.fromString("/"),
        anHTTPMethod: HTTPMethod.DELETE,
        theModifiedTemplate: Template.withCallback(() => ""),
      })
    );
    assertThrows(() =>
      modifyTemplate({
        aRootNode: tree,
        aPath: NodePath.fromString("/level-1-2/level-2-3/level-3-1"),
        anHTTPMethod: HTTPMethod.GET,
        theModifiedTemplate: Template.withCallback(() => ""),
      })
    );
  },
});

Deno.test({
  name:
    "`modifyTemplate` emits a SnapshotWasModified event when applied at the root level",
  fn: () => {
    const eventBus = createEventBus<DomainEvent>();
    const subscriber = spy();

    const modifyTemplate = makeModifyTemplate({ eventBus });

    const modifiedTemplate = Template.withCallback(() => "");

    eventBus.subscribe(subscriber);

    const nextTree = modifyTemplate({
      aRootNode: tree,
      aPath: NodePath.root,
      anHTTPMethod: HTTPMethod.PATCH,
      theModifiedTemplate: modifiedTemplate,
    });

    assertSpyCall(subscriber, 0, {
      args: [
        DomainEvent.TemplateWasModified({
          rootNode: nextTree,
          path: NodePath.root,
          httpMethod: HTTPMethod.PATCH,
          parentNode: nextTree,
          template: modifiedTemplate,
        }),
      ],
    });
  },
});

Deno.test({
  name:
    "`modifyTemplate` emits a SnapshotWasModified event when applied deep in the virtual service tree",
  fn: () => {
    const eventBus = createEventBus<DomainEvent>();
    const subscriber = spy();

    const modifyTemplate = makeModifyTemplate({ eventBus });

    const modifiedTemplate = Template.withCallback(() => "");

    eventBus.subscribe(subscriber);

    const nextTree = modifyTemplate({
      aRootNode: tree,
      aPath: NodePath.fromString("/level-1-2/level-2-3/level-3-1"),
      anHTTPMethod: HTTPMethod.DELETE,
      theModifiedTemplate: modifiedTemplate,
    });

    assertSpyCall(subscriber, 0, {
      args: [
        DomainEvent.TemplateWasModified({
          rootNode: nextTree,
          path: NodePath.fromString("/level-1-2/level-2-3/level-3-1"),
          httpMethod: HTTPMethod.DELETE,
          parentNode: nextTree
            .getChild(PathSegment.fromString("level-1-2"))
            ?.getChild(PathSegment.fromString("level-2-3"))
            ?.getChild(PathSegment.fromString("level-3-1"))!,
          template: modifiedTemplate,
        }),
      ],
    });
  },
});
