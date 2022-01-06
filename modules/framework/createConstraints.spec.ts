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

import { assert, assertThrows } from "../../deps-dev/asserts.ts";

import { createConstraints } from "./createConstraints.ts";

Deno.test({
  name: "creates a class that can be used to enforce constraints",
  fn: () => {
    const MyConstraintsClass = createConstraints("MyDomainConcept");

    assertThrows(() =>
      MyConstraintsClass.check({
        ["2 + 2 = 5"]: 2 + 2 === 5,
      })
    );

    MyConstraintsClass.check({
      ["2 + 2 = 4"]: 2 + 2 === 4,
      ["1 = 1"]: 1 === 1,
    });
  },
});

Deno.test({
  name: "creates a error classes that are distinguishable via instanceof",
  fn: () => {
    const MyConstraintsClass1 = createConstraints("MyDomainConcept1");
    const MyConstraintsClass2 = createConstraints("MyDomainConcept2");

    assert(MyConstraintsClass1.prototype instanceof Error);
    assert(MyConstraintsClass2.prototype instanceof Error);
    assert(!(MyConstraintsClass1.prototype instanceof MyConstraintsClass2));
    assert(!(MyConstraintsClass2.prototype instanceof MyConstraintsClass1));
  },
});
