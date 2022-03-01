/**
 * strawman - A Deno-based service virtualization solution
 * Copyright (C) 2022 Open Formation GmbH
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

import {
  assert,
  assertEquals,
  assertStrictEquals,
} from "../../../../deps-dev/asserts.ts";

import { Argument } from "./Argument.ts";
import { PathSegment } from "./PathSegment.ts";
import { Node } from "./Node.ts";
import { Wildcard } from "./Wildcard.ts";

Deno.test("`Wildcard`", async (t) => {
  await t.step("can be created with a name and a node", () => {
    assert(Wildcard.create("foo", Node.blank()) instanceof Wildcard);
  });

  await t.step("has a node", () => {
    const node = Node.blank();
    const wildcard = Wildcard.create("foo", node);

    assertStrictEquals(wildcard.getNode(), node);
  });

  await t.step("can make arguments", () => {
    const wildcard = Wildcard.create("foo", Node.blank());
    const argument = wildcard.makeArgument(PathSegment.fromString("bar"));

    assert(argument instanceof Argument);
    assertEquals(argument.toEntry(), ["foo", "bar"]);
  });
});
