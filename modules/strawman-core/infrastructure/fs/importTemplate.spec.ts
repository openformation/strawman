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

import {
  assert,
  assertRejects,
} from "../../../../deps-dev/asserts.ts";
import { assertSpyCall, spy } from "../../../../deps-dev/mock.ts";

import { Template } from "../../domain/model/Template.ts";

import { makeImportTemplate } from "./importTemplate.ts";

Deno.test({
  name:
    "`importTemplate` imports a template from a script file, adding a cache buster so it always retrieves a fresh version of the file",
  fn: async () => {
    const importMock = spy(() => Promise.resolve({ default: () => "" }));
    const importTemplate = makeImportTemplate({
      import: importMock,
      timer: () => 1638883111442,
    });

    const result = await importTemplate("/some/path/to/some/script.ts");

    assert(result instanceof Template);

    assertSpyCall(importMock, 0, {
      args: ["file:///some/path/to/some/script.ts?now=1638883111442"],
    });
  },
});

Deno.test({
  name:
    "`importTemplate` returns an error if the script file doesn't export a function as default",
  fn: async () => {
    const importMock = spy(() => Promise.resolve({ default: "Whoops" }));
    const importTemplate = makeImportTemplate({
      import: importMock,
      timer: () => 1638883111442,
    });

    await assertRejects(
      () => importTemplate("/some/path/to/some/script.ts"),
      undefined,
      'Expected "/some/path/to/some/script.ts" to export a function, but got "string" instead.',
    );
  },
});
