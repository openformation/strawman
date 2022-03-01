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

import { assert } from "../../../../deps-dev/asserts.ts";
import { assertSpyCall, spy } from "../../../../deps-dev/mock.ts";
import * as path from "../../../../deps/path.ts";

import { createEventBus } from "../../../framework/createEventBus.ts";
import { createRef } from "../../../framework/createRef.ts";

import { DomainEvent } from "../../domain/events/DomainEvent.ts";
import { HTTPMethod } from "../../domain/model/HTTPMethod.ts";
import { PathSegment } from "../../domain/model/PathSegment.ts";
import { NodePath } from "../../domain/model/NodePath.ts";
import { Node } from "../../domain/model/Node.ts";
import { Template } from "../../domain/model/Template.ts";
import { makeModifyTemplate } from "../../domain/service/modifyTemplate.ts";

import { makeWatchForChanges } from "./watchForChanges.ts";

Deno.test("`watchForChanges`", async (t) => {
  const pathToDirectory = path.join(
    path.dirname(path.fromFileUrl(import.meta.url)),
    "__tmp__",
  );
  await Deno.mkdir(pathToDirectory, { recursive: true });

  await Deno.mkdir(path.join(pathToDirectory, "some/deeper/path"), {
    recursive: true,
  });
  await Deno.writeTextFile(path.join(pathToDirectory, "GET.mock.ts"), "");
  await Deno.writeTextFile(
    path.join(pathToDirectory, "some/deeper/path/POST.mock.ts"),
    "",
  );

  await t.step("it recognizes changes to existing template files", async () => {
    const tree = Node.blank()
      .withAddedChild(
        PathSegment.fromString("some"),
        Node.blank().withAddedChild(
          PathSegment.fromString("deeper"),
          Node.blank().withAddedChild(
            PathSegment.fromString("path"),
            Node.blank().withTemplateForHTTPMethod(
              HTTPMethod.POST,
              Template.withCallback(() => ""),
            ),
          ),
        ),
      )
      .withTemplateForHTTPMethod(
        HTTPMethod.GET,
        Template.withCallback(() => ""),
      );
    const virtualServiceTreeRef = createRef<Node>(tree);
    const template = Template.withCallback(() => "");
    const importTemplate = () => Promise.resolve(template);
    const modifyTemplate = spy(
      makeModifyTemplate({
        eventBus: createEventBus<DomainEvent>(),
      }),
    );
    const watchForChanges = makeWatchForChanges({
      pathToDirectory,
      virtualServiceTreeRef,
      importTemplate,
      modifyTemplate,
    });

    const endWatchForChanges = watchForChanges();

    await new Promise((resolve) => setTimeout(resolve, 500));

    await Deno.writeTextFile(
      path.join(pathToDirectory, "GET.mock.ts"),
      "Some Change 1",
    );

    await new Promise((resolve) => setTimeout(resolve, 500));

    const virtualServiceTreeAfterFirstChange = virtualServiceTreeRef.current;

    await Deno.writeTextFile(
      path.join(pathToDirectory, "some/deeper/path/POST.mock.ts"),
      "Some change 2",
    );

    endWatchForChanges();

    await new Promise((resolve) => setTimeout(resolve, 500));

    assert(virtualServiceTreeRef.current !== tree);
    assert(
      virtualServiceTreeRef.current !== virtualServiceTreeAfterFirstChange,
    );
    assertSpyCall(modifyTemplate, 0, {
      args: [
        {
          aRootNode: tree,
          aPath: NodePath.fromString("/"),
          anHTTPMethod: HTTPMethod.GET,
          theModifiedTemplate: template,
        },
      ],
    });
    assertSpyCall(modifyTemplate, 1, {
      args: [
        {
          aRootNode: virtualServiceTreeAfterFirstChange,
          aPath: NodePath.fromString("/some/deeper/path"),
          anHTTPMethod: HTTPMethod.POST,
          theModifiedTemplate: template,
        },
      ],
    });
  });

  await Deno.remove(pathToDirectory, { recursive: true });
});
