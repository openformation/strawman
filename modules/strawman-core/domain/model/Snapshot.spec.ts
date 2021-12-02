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

import { assertEquals } from "../../../../deps-dev/asserts.ts";

import { Snapshot } from "./Snapshot.ts";

const snapshotAsString = `
200 OK

accept-ranges: bytes
age: 578090
cache-control: max-age=604800
content-type: text/html; charset=UTF-8
date: Fri, 12 Nov 2021 10:09:34 GMT
etag: "3147526947"
expires: Fri, 19 Nov 2021 10:09:34 GMT
last-modified: Thu, 17 Oct 2019 07:18:26 GMT
server: ECS (nyb/1D06)
vary: Accept-Encoding
x-cache: HIT

<!doctype html>
<html>
<head>
    <title>Example Domain</title>

    <meta charset="utf-8" />
    <meta http-equiv="Content-type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type="text/css">
    body {
        background-color: #f0f0f2;
        margin: 0;
        padding: 0;
        font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;

    }
    div {
        width: 600px;
        margin: 5em auto;
        padding: 2em;
        background-color: #fdfdff;
        border-radius: 0.5em;
        box-shadow: 2px 3px 7px 2px rgba(0,0,0,0.02);
    }
    a:link, a:visited {
        color: #38488f;
        text-decoration: none;
    }
    @media (max-width: 700px) {
        div {
            margin: 0 auto;
            width: auto;
        }
    }
    </style>
</head>

<body>
<div>
    <h1>Example Domain</h1>
    <p>This domain is for use in illustrative examples in documents. You may use this
    domain in literature without prior coordination or asking for permission.</p>
    <p><a href="https://www.iana.org/domains/example">More information...</a></p>
</div>
</body>
</html>
`.trim();

Deno.test({
  name: "`Snapshot` can be created from fetch response",
  fn: async () => {
    const response = new Response(JSON.stringify({ hello: "world" }), {
      headers: {
        "content-type": "application/json; charset=UTF-8",
      },
    });
    const snapshot = await Snapshot.fromFetchResponse(response);

    assertEquals(snapshot.props.headers, {
      "content-type": "application/json; charset=UTF-8",
    });

    assertEquals(snapshot.props.body, '{"hello":"world"}');
  },
});

Deno.test({
  name: "`Snapshot` can be created from string",
  fn: () => {
    const snapshot = Snapshot.fromString(snapshotAsString);

    assertEquals(snapshot instanceof Snapshot, true);
  },
});

Deno.test({
  name: "`Snapshot` can be converted into a fetch response",
  fn: () => {
    const snapshot = Snapshot.fromString(snapshotAsString);

    assertEquals(
      snapshot.toFetchResponse(),
      new Response(
        `<!doctype html>
<html>
<head>
    <title>Example Domain</title>

    <meta charset="utf-8" />
    <meta http-equiv="Content-type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type="text/css">
    body {
        background-color: #f0f0f2;
        margin: 0;
        padding: 0;
        font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;

    }
    div {
        width: 600px;
        margin: 5em auto;
        padding: 2em;
        background-color: #fdfdff;
        border-radius: 0.5em;
        box-shadow: 2px 3px 7px 2px rgba(0,0,0,0.02);
    }
    a:link, a:visited {
        color: #38488f;
        text-decoration: none;
    }
    @media (max-width: 700px) {
        div {
            margin: 0 auto;
            width: auto;
        }
    }
    </style>
</head>

<body>
<div>
    <h1>Example Domain</h1>
    <p>This domain is for use in illustrative examples in documents. You may use this
    domain in literature without prior coordination or asking for permission.</p>
    <p><a href="https://www.iana.org/domains/example">More information...</a></p>
</div>
</body>
</html>
`.trim(),
        {
          status: 200,
          statusText: "OK",
          headers: {
            "accept-ranges": "bytes",
            age: "578090",
            "cache-control": "max-age=604800",
            "content-type": "text/html; charset=UTF-8",
            date: "Fri, 12 Nov 2021 10:09:34 GMT",
            etag: '"3147526947"',
            expires: "Fri, 19 Nov 2021 10:09:34 GMT",
            "last-modified": "Thu, 17 Oct 2019 07:18:26 GMT",
            server: "ECS (nyb/1D06)",
            vary: "Accept-Encoding",
            "x-cache": "HIT",
          },
        }
      )
    );
  },
});

Deno.test({
  name: "`Snapshot` can be converted to string",
  fn: async () => {
    const response = new Response(JSON.stringify({ hello: "world" }), {
      status: 404,
      statusText: "Not Found",
      headers: {
        "content-type": "application/json; charset=UTF-8",
      },
    });
    const snapshot = await Snapshot.fromFetchResponse(response);

    assertEquals(
      snapshot.toString(),
      `404 Not Found

content-type: application/json; charset=UTF-8

{"hello":"world"}
`
    );
  },
});
