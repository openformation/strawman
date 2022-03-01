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

import { assert, assertThrows } from "../../../../deps-dev/asserts.ts";

import { PathSegment } from "./PathSegment.ts";

Deno.test({
  name: "`PathSegment` can be created from string",
  fn: () => {
    assert(PathSegment.fromString("some-name") instanceof PathSegment);
  },
});

Deno.test({
  name: "`PathSegment` is a flyweight",
  fn: () => {
    assert(
      PathSegment.fromString("some-name") ===
        PathSegment.fromString("some-name"),
    );
  },
});

Deno.test({
  name: "`PathSegment` must not be empty",
  fn: () => {
    assertThrows(() => PathSegment.fromString(""));
  },
});

Deno.test({
  name:
    "`PathSegment` must only contain characters safe to be used as a URI path segment (as per https://datatracker.ietf.org/doc/html/rfc3986#appendix-A)",
  fn: () => {
    PathSegment.fromString(
      "-_.~!$&'()*+,;=:@abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    );
    assertThrows(() => PathSegment.fromString("thi§-©ould-bé-ä-prôbl€m"));
  },
});
