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

import { success, failure } from "./result.ts";

Deno.test({
  name: '`success` yields a result only if the given result object has a "SUCCESS: " type',
  fn: () => {
    type Result =
      | { type: "SUCCESS: The operation was completed"; value: number }
      | { type: "ERROR: Something bad happened"; cause: Error }
      | { type: "ERROR: Something inexplicable happened"; message: string };

    const successResult: Result = {
      type: "SUCCESS: The operation was completed",
      value: 42,
    };

    const errorResult1: Result = {
      type: "ERROR: Something bad happened",
      cause: new Error(),
    };

    const errorResult2: Result = {
      type: "ERROR: Something inexplicable happened",
      message: "Don't know what to tell ya ¯\\_(ツ)_/¯",
    };

    const [res1] = success(successResult);
    const [res2] = success(errorResult1);
    const [res3] = success(errorResult2);

    assert(res1 === successResult);
    assert(res2 === undefined);
    assert(res3 === undefined);
  },
});

Deno.test({
  name: '`failure` yields a result only if the given result object has an "ERROR: " type',
  fn: () => {
    type Result =
      | { type: "SUCCESS: The operation was completed"; value: number }
      | { type: "ERROR: Something bad happened"; cause: Error }
      | { type: "ERROR: Something inexplicable happened"; message: string };

    const successResult: Result = {
      type: "SUCCESS: The operation was completed",
      value: 42,
    };

    const errorResult1: Result = {
      type: "ERROR: Something bad happened",
      cause: new Error(),
    };

    const errorResult2: Result = {
      type: "ERROR: Something inexplicable happened",
      message: "Don't know what to tell ya ¯\\_(ツ)_/¯",
    };

    const [res1] = failure(successResult);
    const [res2] = failure(errorResult1);
    const [res3] = failure(errorResult2);

    assert(res1 === undefined);
    assert(res2 === errorResult1);
    assert(res3 === errorResult2);
  },
});
