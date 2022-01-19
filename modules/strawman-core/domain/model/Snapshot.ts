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

export class Snapshot {
  private constructor(
    private readonly props: {
      statusCode: number;
      statusText: string;
      headers: Record<string, string>;
      body: null | string;
    }
  ) {}

  public static readonly fromFetchResponse = async (response: Response) =>
    new Snapshot({
      statusCode: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(
        [...response.headers.entries()].filter(
          ([key]) => key.toLowerCase() !== "content-length"
        )
      ),
      body: await response.clone().text(),
    });

  public static readonly fromString = (snapshotAsString: string) => {
    const [statusAsString, headersAsString, ...body] = snapshotAsString
      .trim()
      .split("\n\n");
    const [statusCodeAsString, ...statusTextParts] = statusAsString.split(" ");
    const statusCode = parseInt(statusCodeAsString, 10);
    const statusText = statusTextParts.join(" ");
    const headers: Record<string, string> = {};

    for (const line of headersAsString.split("\n")) {
      if (!line) break;

      const [key, ...value] = line.split(":");
      headers[key] = value.join(":").trim();
    }

    return new Snapshot({
      statusCode,
      statusText,
      headers,
      body: body.length ? body.join("\n\n") : null,
    });
  };

  public readonly toFetchResponse = (): Response =>
    new Response(this.props.body, {
      status: this.props.statusCode,
      statusText: this.props.statusText,
      headers: this.props.headers,
    });

  public readonly toString = (): string =>
    [
      `${this.props.statusCode} ${this.props.statusText}`,
      "",
      ...Object.entries(this.props.headers).map(
        ([key, value]) => `${key}: ${value}`
      ),
      "",
      ...(this.props.body === null ? [] : [this.props.body]),
    ].join("\n");
}
