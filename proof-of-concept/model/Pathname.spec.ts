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
} from "https://deno.land/std/testing/asserts.ts";

import { Pathname } from "./Pathname.ts";

Deno.test({
  name: "`Pathname` can be created from string",
  fn: () => {
    const pathname = Pathname.fromString("/some/path/name");
    assertStrictEquals(pathname.props.value, "/some/path/name");
  },
});

Deno.test({
  name: "`Pathname` knows of itself whether it is a root path or not",
  fn: () => {
    assertStrictEquals(Pathname.fromString("/some/path/name").isRoot, false);
    assertStrictEquals(Pathname.fromString("/").isRoot, true);
  },
});

Deno.test({
  name: "`Pathname` is a flyweight",
  fn: () => {
    assertStrictEquals(
      Pathname.fromString("/some/path/name"),
      Pathname.fromString("/some/path/name")
    );
  },
});

Deno.test({
  name: "`Pathname` must start with a '/'",
  fn: () => {
    assertThrows(() => Pathname.fromString("some/path/name"));
  },
});

Deno.test({
  name: "`Pathname` must not end with a '/'",
  fn: () => {
    assertThrows(() => Pathname.fromString("/some/path/name/"));
  },
});

Deno.test({
  name: "`Pathname` '/' is allowed",
  fn: () => {
    Pathname.fromString("/");
  },
});

Deno.test({
  name: "`Pathname` recognizes descendants",
  fn: () => {
    const ancestor = Pathname.fromString("/some");
    const descendant = Pathname.fromString("/some/path/name");

    assert(ancestor.isAncestorOf(descendant));
    assert(!descendant.isAncestorOf(ancestor));
    assert(ancestor.isAncestorOf(ancestor));
    assert(descendant.isAncestorOf(descendant));
  },
});

Deno.test({
  name: "`Pathname` recognizes children",
  fn: () => {
    const ancestor = Pathname.fromString("/some");
    const child = Pathname.fromString("/some/path");
    const descendant = Pathname.fromString("/some/path/name");

    assert(ancestor.isParentOf(child));
    assert(!ancestor.isParentOf(descendant));
  },
});

Deno.test({
  name: "`Pathname` provides reference to its parent",
  fn: () => {
    const pathname = Pathname.fromString("/some/path/name");

    assertStrictEquals(pathname.parent(), Pathname.fromString("/some/path"));
    assertStrictEquals(
      pathname.parent()?.parent(),
      Pathname.fromString("/some")
    );
    assertStrictEquals(
      pathname.parent()?.parent()?.parent(),
      Pathname.fromString("/")
    );
    assertStrictEquals(pathname.parent()?.parent()?.parent()?.parent(), null);
  },
});

Deno.test({
  name: "`Pathname` can be appended",
  fn: () => {
    assertStrictEquals(
      Pathname.fromString("/").append("subpath"),
      Pathname.fromString("/subpath")
    );
    assertStrictEquals(
      Pathname.fromString("/some/path/name").append("subpath"),
      Pathname.fromString("/some/path/name/subpath")
    );
  },
});

Deno.test({
  name: "`Pathname` cannot be appended with a segment containing '/'",
  fn: () => {
    const pathname = Pathname.fromString("/some/path/name");
    assertThrows(() => pathname.append("sub/path"));
  },
});

Deno.test({
  name: "`Pathname` exposes its basename",
  fn: () => {
    assertStrictEquals(
      Pathname.fromString("/some/path/name").basename(),
      "name"
    );
  },
});

Deno.test({
  name: "basename of `Pathname` '/' is null",
  fn: () => {
    assertStrictEquals(Pathname.fromString("/").basename(), null);
  },
});
