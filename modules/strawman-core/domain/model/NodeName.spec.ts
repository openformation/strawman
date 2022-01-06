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

import { assert, assertThrows } from "../../../../deps-dev/asserts.ts";

import { NodeName } from "./NodeName.ts";

Deno.test({
  name: "`NodeName` can be created from string",
  fn: () => {
    assert(NodeName.fromString("some-name") instanceof NodeName);
  },
});

Deno.test({
  name: "`NodeName` is a flyweight",
  fn: () => {
    assert(
      NodeName.fromString("some-name") === NodeName.fromString("some-name")
    );
  },
});

Deno.test({
  name: "`NodeName` must not be empty",
  fn: () => {
    assertThrows(() => NodeName.fromString(""));
  },
});

Deno.test({
  name: "`NodeName` must only contain characters safe to be used as a URI path segment (as per https://datatracker.ietf.org/doc/html/rfc3986#appendix-A)",
  fn: () => {
    NodeName.fromString("-_.~!$&'()*+,;=:@abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789");
    assertThrows(() => NodeName.fromString("thi§-©ould-bé-ä-prôbl€m"));
  },
});
