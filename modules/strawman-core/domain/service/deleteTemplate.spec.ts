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

import { assertEquals } from "../../../../deps-dev/asserts.ts";
import { assertSpyCall, spy } from "../../../../deps-dev/mock.ts";

import { createEventBus } from "../../../framework/createEventBus.ts";

import { DomainEvent } from "../events/DomainEvent.ts";
import { PathSegment } from "../model/PathSegment.ts";
import { Path } from "../model/Path.ts";
import { Node } from "../model/Node.ts";
import { HTTPMethod } from "../model/HTTPMethod.ts";
import { Template } from "../model/Template.ts";

import { makeDeleteTemplate } from "./deleteTemplate.ts";

const templateStub = Template.withCallback(() => "");

Deno.test({
  name: "`deleteTemplate` removes a template from the root level of a tree",
  fn: () => {
    const eventBus = createEventBus<DomainEvent>();
    const deleteTemplate = makeDeleteTemplate({ eventBus });
    const tree = Node.blank()
      .withTemplateForHTTPMethod(
        HTTPMethod.GET,
        templateStub,
      );

    assertEquals(
      deleteTemplate({
        aRootNode: tree,
        anHTTPMethod: HTTPMethod.GET,
        aPath: Path.fromString("/"),
      }).getTemplateForHTTPMethod(HTTPMethod.GET),
      null,
    );
  },
});

Deno.test({
  name: "`deleteTemplate` removes a template from a deeper level of a tree",
  fn: () => {
    const eventBus = createEventBus<DomainEvent>();
    const deleteTemplate = makeDeleteTemplate({ eventBus });
    const tree = Node.blank()
      .withAddedChild(
        PathSegment.fromString("level-1"),
        Node.blank().withAddedChild(
          PathSegment.fromString("level-2"),
          Node.blank()
            .withTemplateForHTTPMethod(
              HTTPMethod.PATCH,
              templateStub,
            ),
        ),
      );

    assertEquals(
      deleteTemplate({
        aRootNode: tree,
        anHTTPMethod: HTTPMethod.PATCH,
        aPath: Path.fromString("/level-1/level-2"),
      }).getChild(PathSegment.fromString("level-1"))?.getChild(
        PathSegment.fromString("level-2"),
      )?.getTemplateForHTTPMethod(HTTPMethod.PATCH),
      null,
    );
  },
});

Deno.test({
  name:
    "`deleteTemplate` emits a TemplateWasDeleted event when applied at the root level",
  fn: () => {
    const eventBus = createEventBus<DomainEvent>();
    const deleteTemplate = makeDeleteTemplate({ eventBus });
    const tree = Node.blank()
      .withTemplateForHTTPMethod(
        HTTPMethod.PATCH,
        templateStub,
      );
    const subscriber = spy();

    eventBus.subscribe(subscriber);

    const nextTree = deleteTemplate({
      aRootNode: tree,
      aPath: Path.root,
      anHTTPMethod: HTTPMethod.PATCH,
    });

    assertSpyCall(subscriber, 0, {
      args: [
        DomainEvent.TemplateWasDeleted({
          rootNode: nextTree,
          path: Path.root,
          httpMethod: HTTPMethod.PATCH,
          template: templateStub,
        }),
      ],
    });
  },
});

Deno.test({
  name:
    "`deleteTemplate` emits a TemplateWasDeleted event when applied at a deeper level",
  fn: () => {
    const eventBus = createEventBus<DomainEvent>();
    const deleteTemplate = makeDeleteTemplate({ eventBus });
    const tree = Node.blank()
      .withAddedChild(
        PathSegment.fromString("level-1"),
        Node.blank().withAddedChild(
          PathSegment.fromString("level-2"),
          Node.blank()
            .withTemplateForHTTPMethod(
              HTTPMethod.POST,
              templateStub,
            ),
        ),
      );
    const subscriber = spy();

    eventBus.subscribe(subscriber);

    const nextTree = deleteTemplate({
      aRootNode: tree,
      aPath: Path.fromString("/level-1/level-2"),
      anHTTPMethod: HTTPMethod.POST,
    });

    assertSpyCall(subscriber, 0, {
      args: [
        DomainEvent.TemplateWasDeleted({
          rootNode: nextTree,
          path: Path.fromString("/level-1/level-2"),
          httpMethod: HTTPMethod.POST,
          template: templateStub,
        }),
      ],
    });
  },
});
