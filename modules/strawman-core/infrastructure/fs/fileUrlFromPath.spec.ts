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

import { assert } from "../../../../deps-dev/asserts.ts";

import { fileUrlFromPath } from "./fileUrlFromPath.ts";

Deno.test({
  name: "`fileUrlFromPath` takes a file url and returns it as-is",
  fn: () => {
    assert(
      fileUrlFromPath("file:///some/file/path") === "file:///some/file/path"
    );
  },
});

Deno.test({
  name: "`fileUrlFromPath` takes an absolute path and returns it as a file url",
  fn: () => {
    assert(fileUrlFromPath("/some/file/path") === "file:///some/file/path");
  },
});

Deno.test({
  name: "`fileUrlFromPath` takes a relative path and returns it as a file url, resolving it with the current working directory as a base",
  fn: () => {
    assert(
      fileUrlFromPath("some/file/path") ===
        `file://${Deno.cwd()}/some/file/path`
    );
    assert(
      fileUrlFromPath("./some/file/path") ===
        `file://${Deno.cwd()}/some/file/path`
    );
  },
});
