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
  assertStrictEquals,
  assertThrows,
} from "https://deno.land/std/testing/asserts.ts";

import { HTTPMethod } from "./HTTPMethod.ts";

Deno.test({
  name: "`HTTPMethod` can be created from string",
  fn: () => {
    assertStrictEquals(HTTPMethod.fromString("GET"), HTTPMethod.GET);
    assertStrictEquals(HTTPMethod.fromString("HEAD"), HTTPMethod.HEAD);
    assertStrictEquals(HTTPMethod.fromString("POST"), HTTPMethod.POST);
    assertStrictEquals(HTTPMethod.fromString("PUT"), HTTPMethod.PUT);
    assertStrictEquals(HTTPMethod.fromString("DELETE"), HTTPMethod.DELETE);
    assertStrictEquals(HTTPMethod.fromString("CONNECT"), HTTPMethod.CONNECT);
    assertStrictEquals(HTTPMethod.fromString("OPTIONS"), HTTPMethod.OPTIONS);
    assertStrictEquals(HTTPMethod.fromString("TRACE"), HTTPMethod.TRACE);
    assertStrictEquals(HTTPMethod.fromString("PATCH"), HTTPMethod.PATCH);

    assertThrows(() => HTTPMethod.fromString("UNKNWON"));
  },
});
