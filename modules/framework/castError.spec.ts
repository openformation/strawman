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

import { assert, assertEquals } from "../../deps-dev/asserts.ts";

import { castError } from "./castError.ts";

Deno.test({
  name: "`castError` takes an Error and returns it as-is",
  fn: () => {
    const error = new Error();
    assert(castError(error) === error);
  },
});

Deno.test({
  name: "`castError` takes a string and returns an Error using that string as the error message",
  fn: () => {
    assertEquals(
      castError("Some Error occurred").message,
      "Some Error occurred"
    );
  },
});

Deno.test({
  name: "`castError` takes any value that is neither a string nor an Error and returns an Error hinting at that very fact",
  fn: () => {
    assertEquals(
      castError(12).message,
      'An unexpected error of type "number" occurred'
    );
    assertEquals(
      castError(undefined).message,
      'An unexpected error of type "undefined" occurred'
    );
    assertEquals(
      castError(NaN).message,
      'An unexpected error of type "NaN" occurred'
    );
    assertEquals(
      castError({}).message,
      'An unexpected error of type "object" occurred'
    );
    assertEquals(
      castError(() => {}).message,
      'An unexpected error of type "function" occurred'
    );
  },
});
