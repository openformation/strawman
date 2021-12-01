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

import {
  assert,
  assertStrictEquals,
  assertThrows,
} from "../../../../deps-dev/asserts.ts";

import { NodeName } from "./NodeName.ts";
import { NodePath } from "./NodePath.ts";

Deno.test({
  name: "`NodePath` can be created from string",
  fn: () => {
    assert(NodePath.fromString("/") instanceof NodePath);
    assert(NodePath.fromString("/some/path") instanceof NodePath);
  },
});

Deno.test({
  name: "`NodePath` (as string) must start with a '/'",
  fn: () => {
    assertThrows(() => NodePath.fromString("some-path"));
    assertThrows(() => NodePath.fromString(""));
  },
});

Deno.test({
  name: "`NodePath` (as string) must not end with a '/'",
  fn: () => {
    assertThrows(() => NodePath.fromString("//"));
    assertThrows(() => NodePath.fromString("/////"));
    assertThrows(() => NodePath.fromString("/some-path/with/trailing/slash/"));
  },
});

Deno.test({
  name: "`NodePath` can be created from `NodeName`",
  fn: () => {
    assert(
      NodePath.fromNodeName(NodeName.fromString("some-node-name")) instanceof
        NodePath
    );
  },
});

Deno.test({
  name: "`NodePath` is iterable",
  fn: () => {
    const [...segments] = NodePath.fromString("/some/node/path");

    assertStrictEquals(segments.length, 3);

    assertStrictEquals(segments[0], NodeName.fromString("some"));
    assertStrictEquals(segments[1], NodeName.fromString("node"));
    assertStrictEquals(segments[2], NodeName.fromString("path"));
  },
});

Deno.test({
  name: "`NodePath` (when root) is iterable",
  fn: () => {
    const [...segments] = NodePath.fromString("/");

    assertStrictEquals(segments.length, 0);
  },
});

Deno.test({
  name: "`NodePath` can be converted to string",
  fn: () => {
    const path = NodePath.fromString("/some/node/path");

    assertStrictEquals(path.toString(), "/some/node/path");
  },
});

Deno.test({
  name: "`NodePath` can be appended",
  fn: () => {
    const path = NodePath.fromString("/some/node/path");
    const appendedPath = path.withAppendedSegment(
      NodeName.fromString("appendix")
    );

    assert(appendedPath instanceof NodePath);
    assert(appendedPath !== path);

    assertStrictEquals(appendedPath.toString(), "/some/node/path/appendix");
  },
});
