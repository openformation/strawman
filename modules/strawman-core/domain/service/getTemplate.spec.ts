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

import { assertEquals } from "../../../../deps-dev/asserts.ts";

import { HTTPMethod } from "../model/HTTPMethod.ts";
import { Template } from "../model/Template.ts";
import { NodeName } from "../model/NodeName.ts";
import { NodePath } from "../model/NodePath.ts";
import { Node } from "../model/Node.ts";

import { getTemplate } from "./getTemplate.ts";

const rootTemplate = Template.withCallback(() => "");
const level1Template = Template.withCallback(() => "");
const level2Template = Template.withCallback(() => "");
const level3Template = Template.withCallback(() => "");
const tree = Node.blank()
  .withAddedChild(NodeName.fromString("level-1-1"), Node.blank())
  .withAddedChild(
    NodeName.fromString("level-1-2"),
    Node.blank()
      .withAddedChild(
        NodeName.fromString("level-2-1"),
        Node.blank().withTemplateForHTTPMethod(HTTPMethod.POST, level2Template)
      )
      .withAddedChild(NodeName.fromString("level-2-2"), Node.blank())
      .withAddedChild(
        NodeName.fromString("level-2-3"),
        Node.blank().withAddedChild(
          NodeName.fromString("level-3-1"),
          Node.blank().withTemplateForHTTPMethod(
            HTTPMethod.DELETE,
            level3Template
          )
        )
      )
  )
  .withAddedChild(
    NodeName.fromString("level-1-3"),
    Node.blank().withTemplateForHTTPMethod(HTTPMethod.GET, level1Template)
  )
  .withTemplateForHTTPMethod(HTTPMethod.PATCH, rootTemplate);

Deno.test({
  name: "`getTemplate` retrieves known templates from any level of a virtual service tree",
  fn: () => {
    assertEquals(
      getTemplate({
        aRootNode: tree,
        aPath: NodePath.fromString("/"),
        anHTTPMethod: HTTPMethod.PATCH,
      }),
      rootTemplate
    );
    assertEquals(
      getTemplate({
        aRootNode: tree,
        aPath: NodePath.fromString("/level-1-3"),
        anHTTPMethod: HTTPMethod.GET,
      }),
      level1Template
    );
    assertEquals(
      getTemplate({
        aRootNode: tree,
        aPath: NodePath.fromString("/level-1-2/level-2-1"),
        anHTTPMethod: HTTPMethod.POST,
      }),
      level2Template
    );
    assertEquals(
      getTemplate({
        aRootNode: tree,
        aPath: NodePath.fromString("/level-1-2/level-2-3/level-3-1"),
        anHTTPMethod: HTTPMethod.DELETE,
      }),
      level3Template
    );
  },
});

Deno.test({
  name: "`getTemplate` returns null if a template cannot be found at the given path",
  fn: () => {
    assertEquals(
      getTemplate({
        aRootNode: tree,
        aPath: NodePath.fromString("/level-1-2/un/known"),
        anHTTPMethod: HTTPMethod.DELETE,
      }),
      null
    );
  },
});

Deno.test({
  name: "`getTemplate` returns null if a template cannot be found for the given HTTPMethod",
  fn: () => {
    assertEquals(
      getTemplate({
        aRootNode: tree,
        aPath: NodePath.fromString("/"),
        anHTTPMethod: HTTPMethod.DELETE,
      }),
      null
    );
    assertEquals(
      getTemplate({
        aRootNode: tree,
        aPath: NodePath.fromString("/level-1-2/level-2-3/level-3-1"),
        anHTTPMethod: HTTPMethod.GET,
      }),
      null
    );
  },
});
