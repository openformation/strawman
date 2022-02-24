/**
 * strawman - A Deno-based service virtualization solution
 * Copyright (C) 2022 Open Formation GmbH
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

import { assertEquals, assertStrictEquals } from "../../deps-dev/asserts.ts";

import { createSignal } from "./createSignal.ts";

Deno.test({
  name: "`Signal` implements async iterator protocol",
  fn: async () => {
    const signal = createSignal<string>();

    setTimeout(() => signal.send("Hello"), 100);
    setTimeout(() => signal.send("World"), 200);
    setTimeout(() => signal.send("!"), 300);

    let numberOfReceivedValues = 0;
    for await (const value of signal) {
      numberOfReceivedValues++;

      if (numberOfReceivedValues === 1) {
        assertStrictEquals("Hello", value);
      }
      if (numberOfReceivedValues === 2) {
        assertStrictEquals("World", value);
      }
      if (numberOfReceivedValues === 3) {
        assertStrictEquals("!", value);
      }
      if (numberOfReceivedValues >= 3) break;
    }

    assertEquals(numberOfReceivedValues, 3);
  },
});

Deno.test({
  name: "`Signal` also works synchronously",
  fn: async () => {
    const signal = createSignal<string>();

    setTimeout(() => {
      signal.send("Hello");
      signal.send("World");
      signal.send("!");
    }, 100);

    let numberOfReceivedValues = 0;
    for await (const value of signal) {
      numberOfReceivedValues++;

      if (numberOfReceivedValues === 1) {
        assertStrictEquals("Hello", value);
      }
      if (numberOfReceivedValues === 2) {
        assertStrictEquals("World", value);
      }
      if (numberOfReceivedValues === 3) {
        assertStrictEquals("!", value);
      }
      if (numberOfReceivedValues >= 3) break;
    }

    assertEquals(numberOfReceivedValues, 3);
  },
});
