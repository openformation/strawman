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

import { assert } from "../../deps-dev/asserts.ts";

import { createRef } from "./createRef.ts";

Deno.test({
  name: "`createRef` creates a reference to another object",
  fn: () => {
    type MyObject = { foo: string };
    const myObject: MyObject = { foo: "bar" };
    const myOtherObject: MyObject = { foo: "baz" };
    const myObjectRef = createRef<MyObject>(myObject);

    assert(myObjectRef.current === myObject);
    assert(myObjectRef.current !== myOtherObject);

    myObjectRef.current = myOtherObject;

    assert(myObjectRef.current !== myObject);
    assert(myObjectRef.current === myOtherObject);
  },
});
Deno.test({
  name: "`createRef` initializes with null unless an explicit initial Value was given",
  fn: () => {
    type MyObject = { foo: string };
    const myObject: MyObject = { foo: "bar" };
    const myObjectRef1 = createRef<MyObject>(null);
    const myObjectRef2 = createRef<MyObject>(myObject);

    assert(myObjectRef1.current === null);
    assert(myObjectRef2.current === myObject);
  },
});
