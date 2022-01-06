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
} from "../../../../deps-dev/asserts.ts";

import { HTTPMethod } from "./HTTPMethod.ts";

Deno.test({
  name: "`HTTPMethod` can be created from string",
  fn: () => {
    assertStrictEquals(HTTPMethod.fromString("GET"), HTTPMethod.GET);
    assertStrictEquals(HTTPMethod.fromString("HEAD"), HTTPMethod.HEAD);
    assertStrictEquals(HTTPMethod.fromString("POST"), HTTPMethod.POST);
    assertStrictEquals(HTTPMethod.fromString("PUT"), HTTPMethod.PUT);
    assertStrictEquals(HTTPMethod.fromString("DELETE"), HTTPMethod.DELETE);
    assertStrictEquals(HTTPMethod.fromString("OPTIONS"), HTTPMethod.OPTIONS);
    assertStrictEquals(HTTPMethod.fromString("PATCH"), HTTPMethod.PATCH);

    assertThrows(() => HTTPMethod.fromString("UNKNWON"));
  },
});

Deno.test({
  name: "`HTTPMethod` can be created from request",
  fn: () => {
    assertStrictEquals(
      HTTPMethod.ofRequest(
        new Request("https://example.com", { method: "GET" })
      ),
      HTTPMethod.GET
    );
    assertStrictEquals(
      HTTPMethod.ofRequest(
        new Request("https://example.com", { method: "HEAD" })
      ),
      HTTPMethod.HEAD
    );
    assertStrictEquals(
      HTTPMethod.ofRequest(
        new Request("https://example.com", { method: "POST" })
      ),
      HTTPMethod.POST
    );
    assertStrictEquals(
      HTTPMethod.ofRequest(
        new Request("https://example.com", { method: "PUT" })
      ),
      HTTPMethod.PUT
    );
    assertStrictEquals(
      HTTPMethod.ofRequest(
        new Request("https://example.com", { method: "DELETE" })
      ),
      HTTPMethod.DELETE
    );
    assertStrictEquals(
      HTTPMethod.ofRequest(
        new Request("https://example.com", { method: "OPTIONS" })
      ),
      HTTPMethod.OPTIONS
    );
    assertStrictEquals(
      HTTPMethod.ofRequest(
        new Request("https://example.com", { method: "PATCH" })
      ),
      HTTPMethod.PATCH
    );
  },
});

Deno.test({
  name: "`HTTPMethod` can be converted to string",
  fn: () => {
    assertStrictEquals(HTTPMethod.GET.toString(), "GET");
    assertStrictEquals(HTTPMethod.HEAD.toString(), "HEAD");
    assertStrictEquals(HTTPMethod.POST.toString(), "POST");
    assertStrictEquals(HTTPMethod.PUT.toString(), "PUT");
    assertStrictEquals(HTTPMethod.DELETE.toString(), "DELETE");
    assertStrictEquals(HTTPMethod.OPTIONS.toString(), "OPTIONS");
    assertStrictEquals(HTTPMethod.PATCH.toString(), "PATCH");
  },
});


Deno.test({
  name: "`HTTPMethod` is statically iterable",
  fn: () => {
    const [...httpMethods] = HTTPMethod;

    assertStrictEquals(httpMethods.length, 7);

    assertStrictEquals(httpMethods[0], HTTPMethod.GET);
    assertStrictEquals(httpMethods[1], HTTPMethod.HEAD);
    assertStrictEquals(httpMethods[2], HTTPMethod.POST);
    assertStrictEquals(httpMethods[3], HTTPMethod.PUT);
    assertStrictEquals(httpMethods[4], HTTPMethod.DELETE);
    assertStrictEquals(httpMethods[5], HTTPMethod.OPTIONS);
    assertStrictEquals(httpMethods[6], HTTPMethod.PATCH);
  }
})
