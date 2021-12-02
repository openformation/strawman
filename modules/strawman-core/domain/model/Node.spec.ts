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

import { assert, assertStrictEquals } from "../../../../deps-dev/asserts.ts";

import { HTTPMethod } from "./HTTPMethod.ts";
import { Snapshot } from "./Snapshot.ts";
import { Template } from "./Template.ts";
import { Node } from "./Node.ts";

Deno.test({
  name: "`Node` can be created as blank",
  fn: () => {
    assert(Node.blank() instanceof Node);
  },
});

Deno.test({
  name: "`Node` can contain templates",
  fn: async () => {
    const template = Template.fromSnapshot(
      await Snapshot.fromFetchResponse(
        new Response(JSON.stringify({ hello: "world" }), {
          headers: {
            "content-type": "application/json; charset=UTF-8",
          },
        })
      )
    );
    const node = Node.blank().withTemplateForHTTPMethod(
      HTTPMethod.GET,
      template
    );

    assertStrictEquals(node.getTemplateForHTTPMethod(HTTPMethod.GET), template);
  },
});

Deno.test({
  name: "`Node.getTemplateForHTTPMethod` returns null for unknown templates",
  fn: () => {
    assertStrictEquals(
      Node.blank().getTemplateForHTTPMethod(HTTPMethod.GET),
      null
    );
  },
});

Deno.test({
  name: "`Node` can have children",
  fn: () => {
    const child1 = Node.blank();
    const child2 = Node.blank();
    const child3 = Node.blank();
    const node = Node.blank()
      .withAddedChild("child1", child1)
      .withAddedChild("child2", child2)
      .withAddedChild("child3", child3);

    assertStrictEquals(node.getChild("child1"), child1);
    assertStrictEquals(node.getChild("child2"), child2);
    assertStrictEquals(node.getChild("child3"), child3);
  },
});

Deno.test({
  name: "`Node.getChild` returns null for unknown children",
  fn: () => {
    assertStrictEquals(Node.blank().getChild("someChild"), null);
  },
});
