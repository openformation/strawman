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

import { assert, assertObjectMatch } from "../../../../deps-dev/asserts.ts";

import { Snapshot } from "./Snapshot.ts";
import { Template } from "./Template.ts";

Deno.test({
  name: "`Template` can be created from a closure",
  fn: () => {
    assert(Template.withCallback(() => "") instanceof Template);
  },
});

Deno.test({
  name: "`Template` can be created from a snapshot",
  fn: async () => {
    const response = new Response(JSON.stringify({ foo: "bar" }), {
      status: 200,
      statusText: "OK",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const snapshot = await Snapshot.fromFetchResponse(response);

    assert(Template.fromSnapshot(snapshot) instanceof Template);
  },
});

Deno.test({
  name: "`Template` (from a static snapshot) can generate a fetch response",
  fn: async () => {
    const response = new Response(JSON.stringify({ foo: "bar" }), {
      status: 200,
      statusText: "OK",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const snapshot = await Snapshot.fromFetchResponse(response);
    const template = Template.fromSnapshot(snapshot);

    assertObjectMatch(
      Object(
        await template.generateResponse(new Request("https://example.com"))
      ),

      // Why do we have to create a new response object for assertion?
      //   response.clone() (called in Snapshot.fromFetchResponse) modifies the
      //   source response object. This rather surprising behavior
      //   unfortunately makes it impossible to compare the newly created
      //   response from `generateResponse` with the original value.
      Object(
        new Response(JSON.stringify({ foo: "bar" }), {
          status: 200,
          statusText: "OK",
          headers: {
            "Content-Type": "application/json",
          },
        })
      )
    );
  },
});

Deno.test({
  name: "`Template` (from a dynamic callback) can generate a fetch response",
  fn: async () => {
    const template = Template.withCallback((request) => {
      const url = new URL(request.url);
      const name = url.searchParams.get("name");

      return [
        name === null ? "404 Not Found" : "200 OK",
        "",
        "content-type: text/plain",
        "",
        name === null
          ? "Don't know who you are..."
          : `May the force be with you, ${name}!`,
        "",
      ].join("\n");
    });

    assertObjectMatch(
      Object(
        await template.generateResponse(new Request("https://example.com/"))
      ),
      Object(
        new Response("Don't know who you are...", {
          status: 404,
          statusText: "Not Found",
          headers: {
            "content-type": "text/plain",
          },
        })
      )
    );
    assertObjectMatch(
      Object(
        await template.generateResponse(
          new Request("https://example.com/?name=Leia")
        )
      ),
      Object(
        new Response("May the force be with you, Leia!", {
          status: 200,
          statusText: "OK",
          headers: {
            "content-type": "text/plain",
          },
        })
      )
    );
  },
});
