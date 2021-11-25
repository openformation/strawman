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

import { assertStrictEquals } from "https://deno.land/std/testing/asserts.ts";

import { HTTPMethod } from "./HTTPMethod.ts";
import { Snapshot } from "./Snapshot.ts";
import { Template } from "./Template.ts";
import { Node } from "./Node.ts";
import { NodeName } from "./NodeName.ts";

Deno.test({
  name: "`VirtualServiceTreeNode` can be created as root",
  fn: () => {
    assertStrictEquals(Node.root() instanceof Node, true);
  },
});

Deno.test({
  name: "`VirtualServiceTreeNode` can be created with name",
  fn: () => {
    assertStrictEquals(
      Node.withName(NodeName.fromString("someName")) instanceof Node,
      true
    );
  },
});

Deno.test({
  name: "`VirtualServiceTreeNode` can contain templates",
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
    const node = Node.withName(
      NodeName.fromString("someName")
    ).withAddedTemplate(HTTPMethod.GET, template);

    assertStrictEquals(node.getTemplateForHTTPMethod(HTTPMethod.GET), template);
  },
});

Deno.test({
  name: "`VirtualServiceTreeNode.getTemplateForHTTPMethod` returns null for unknown templates",
  fn: () => {
    const node = Node.withName(NodeName.fromString("someName"));

    assertStrictEquals(node.getTemplateForHTTPMethod(HTTPMethod.GET), null);
  },
});

Deno.test({
  name: "`VirtualServiceTreeNode` can have children",
  fn: () => {
    const child1 = Node.withName(NodeName.fromString("child1"));
    const child2 = Node.withName(NodeName.fromString("child2"));
    const child3 = Node.withName(NodeName.fromString("child3"));
    const node = Node.withName(NodeName.fromString("parent"))
      .withAddedChild(child1)
      .withAddedChild(child2)
      .withAddedChild(child3);

    assertStrictEquals(node.getChild(NodeName.fromString("child1")), child1);
    assertStrictEquals(node.getChild(NodeName.fromString("child2")), child2);
    assertStrictEquals(node.getChild(NodeName.fromString("child3")), child3);
  },
});

Deno.test({
  name: "`VirtualServiceTreeNode.getChild` returns null for unknown children",
  fn: () => {
    const node = Node.withName(NodeName.fromString("parent"));

    assertStrictEquals(node.getChild(NodeName.fromString("someChild")), null);
  },
});
