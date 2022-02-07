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

import { assertEquals, assertThrows } from "../../deps-dev/asserts.ts";

import { createStrategy } from "./createStrategy.ts";

Deno.test({
  name: "`createStrategy` initializes with the first alternative",
  fn: () => {
    const strategy = createStrategy({ a: 1, b: 2 });
    assertEquals(strategy.current, 1);
  },
});

Deno.test({
  name: "A strategy can be set to any of the available alternatives",
  fn: () => {
    const strategy = createStrategy({ a: 1, b: 2, c: 3 });
    assertEquals(strategy.current, 1);

    strategy.set("b");
    assertEquals(strategy.current, 2);

    strategy.set("c");
    assertEquals(strategy.current, 3);

    strategy.set("a");
    assertEquals(strategy.current, 1);
  },
});

Deno.test({
  name: "A strategy must be defined with at least one alternative",
  fn: () => {
    assertThrows(() => createStrategy({}));
  },
});
