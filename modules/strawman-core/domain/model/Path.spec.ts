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

import {
  assert,
  assertStrictEquals,
  assertThrows,
} from "../../../../deps-dev/asserts.ts";

import { PathSegment } from "./PathSegment.ts";
import { Path } from "./Path.ts";

Deno.test({
  name: "`Path` can be created from string",
  fn: () => {
    assert(Path.fromString("/") instanceof Path);
    assert(Path.fromString("/some/path") instanceof Path);
  },
});

Deno.test({
  name: "`Path` is a flyweight",
  fn: () => {
    assert(Path.fromString("/") === Path.root);
    assert(
      Path.root.append(PathSegment.fromString("some")) ===
        Path.fromString("/some"),
    );
    assert(
      Path.fromString("/some/path") === Path.fromString("/some/path"),
    );
    assert(
      Path.fromString("/some/path") ===
        Path.fromString("/some").append(PathSegment.fromString("path")),
    );
  },
});

Deno.test({
  name: "`Path` (as string) must start with a '/'",
  fn: () => {
    assertThrows(() => Path.fromString("some-path"));
    assertThrows(() => Path.fromString(""));
  },
});

Deno.test({
  name: "`Path` (as string) must not end with a '/'",
  fn: () => {
    assertThrows(() => Path.fromString("//"));
    assertThrows(() => Path.fromString("/////"));
    assertThrows(() => Path.fromString("/some-path/with/trailing/slash/"));
  },
});

Deno.test({
  name: "`Path` is iterable",
  fn: () => {
    const [...segments] = Path.fromString("/some/node/path");

    assertStrictEquals(segments.length, 3);

    assertStrictEquals(segments[0], PathSegment.fromString("some"));
    assertStrictEquals(segments[1], PathSegment.fromString("node"));
    assertStrictEquals(segments[2], PathSegment.fromString("path"));
  },
});

Deno.test({
  name: "`Path` (when root) is iterable",
  fn: () => {
    const [...segments] = Path.fromString("/");

    assertStrictEquals(segments.length, 0);
  },
});

Deno.test({
  name: "`Path` can be converted to string",
  fn: () => {
    const path = Path.fromString("/some/node/path");

    assertStrictEquals(path.toString(), "/some/node/path");
  },
});

Deno.test({
  name: "`Path` can be appended",
  fn: () => {
    const path = Path.fromString("/some/node/path");
    const appendedPath = path.append(PathSegment.fromString("appendix"));

    assert(appendedPath instanceof Path);
    assert(appendedPath !== path);

    assertStrictEquals(appendedPath.toString(), "/some/node/path/appendix");
  },
});
