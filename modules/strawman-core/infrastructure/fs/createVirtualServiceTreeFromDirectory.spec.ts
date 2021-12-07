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
  assert,
  assertEquals,
  assertResponseEquals,
} from "../../../../deps-dev/asserts.ts";

import * as path from "../../../../deps/path.ts";

import { HTTPMethod } from "../../domain/model/HTTPMethod.ts";
import { NodeName } from "../../domain/model/NodeName.ts";

import { makeImportTemplate } from "./importTemplate.ts";
import { makeCreateVirtualServiceTreeFromDirectory } from "./createVirtualServiceTreeFromDirectory.ts";

Deno.test({
  name: "`createVirtualServiceTreeFromDirectory` creates a virtual service tree from the given directory",
  fn: async () => {
    const createVirtualServiceTreeFromDirectory =
      makeCreateVirtualServiceTreeFromDirectory({
        importTemplate: makeImportTemplate({
          import: (pathToScriptFile: string) => import(pathToScriptFile),
          timer: Date.now,
        }),
      });
    const pathToDirectory = path.join(
      path.dirname(path.fromFileUrl(import.meta.url)),
      "__fixtures__"
    );

    const result = await createVirtualServiceTreeFromDirectory(pathToDirectory);

    assert(result.type === "SUCCESS: Virtual service tree was created");
    assertResponseEquals(
      await result.value
        .getTemplateForHTTPMethod(HTTPMethod.GET)
        .generateResponse(new Request("https://example.com")),
      new Response(
        '{"requestMethod":"GET","url":"https://example.com/","message":"Lorem ipsum..."}',
        {
          status: 200,
          statusText: "OK",
          headers: {
            "content-type": "application/json",
          },
        }
      )
    );
    assertResponseEquals(
      await result.value
        .getChild(NodeName.fromString("some"))
        ?.getChild(NodeName.fromString("deeper"))
        ?.getChild(NodeName.fromString("path"))
        ?.getTemplateForHTTPMethod(HTTPMethod.POST)
        .generateResponse(
          new Request("https://example.com", { method: "POST" })
        )!,
      new Response(
        '{"requestMethod":"POST","url":"https://example.com/","message":"Foo Bar..."}',
        {
          status: 404,
          statusText: "Not Found",
          headers: {
            "content-type": "application/json",
          },
        }
      )
    );
  },
});

Deno.test({
  name: "`createVirtualServiceTreeFromDirectory` returns an error if the given directory can not be read",
  fn: async () => {
    const createVirtualServiceTreeFromDirectory =
      makeCreateVirtualServiceTreeFromDirectory({
        importTemplate: makeImportTemplate({
          import: (pathToScriptFile: string) => import(pathToScriptFile),
          timer: Date.now,
        }),
      });
    const pathToDirectory = path.join(
      path.dirname(path.fromFileUrl(import.meta.url)),
      "__fixtures__/some-nonexistent-directory"
    );

    const result = await createVirtualServiceTreeFromDirectory(pathToDirectory);

    assert(result.type === "ERROR: Directory could not be read");
  },
});

Deno.test({
  name: "`createVirtualServiceTreeFromDirectory` returns an error if a template cannot be imported",
  fn: async () => {
    const createVirtualServiceTreeFromDirectory =
      makeCreateVirtualServiceTreeFromDirectory({
        importTemplate: () =>
          Promise.resolve({
            type: "ERROR: Template was not a function",
            message: "The template was not a function",
          }),
      });
    const pathToDirectory = path.join(
      path.dirname(path.fromFileUrl(import.meta.url)),
      "__fixtures__"
    );

    const result = await createVirtualServiceTreeFromDirectory(pathToDirectory);

    assert(result.type === "ERROR: Template could not be imported");
    assert(result.cause.type === "ERROR: Template was not a function");
    assertEquals(result.cause.message, "The template was not a function");
  },
});
