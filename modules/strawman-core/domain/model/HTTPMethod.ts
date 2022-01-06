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

export class HTTPMethod {
  private constructor(
    public readonly props: {
      readonly name: string;
    }
  ) {}

  public static readonly GET = new HTTPMethod({ name: "GET" });
  public static readonly HEAD = new HTTPMethod({ name: "HEAD" });
  public static readonly POST = new HTTPMethod({ name: "POST" });
  public static readonly PUT = new HTTPMethod({ name: "PUT" });
  public static readonly DELETE = new HTTPMethod({ name: "DELETE" });
  public static readonly OPTIONS = new HTTPMethod({ name: "OPTIONS" });
  public static readonly PATCH = new HTTPMethod({ name: "PATCH" });

  public static readonly [Symbol.iterator] = function* () {
    yield HTTPMethod.GET;
    yield HTTPMethod.HEAD;
    yield HTTPMethod.POST;
    yield HTTPMethod.PUT;
    yield HTTPMethod.DELETE;
    yield HTTPMethod.OPTIONS;
    yield HTTPMethod.PATCH;
  };

  public static readonly fromString = (string: string) => {
    switch (string.toUpperCase()) {
      case "GET":
        return HTTPMethod.GET;
      case "HEAD":
        return HTTPMethod.HEAD;
      case "POST":
        return HTTPMethod.POST;
      case "PUT":
        return HTTPMethod.PUT;
      case "DELETE":
        return HTTPMethod.DELETE;
      case "OPTIONS":
        return HTTPMethod.OPTIONS;
      case "PATCH":
        return HTTPMethod.PATCH;
      default:
        throw UnknownHTTPMethod.duringStringConversion(string);
    }
  };

  public static readonly ofRequest = (request: Request) => {
    return HTTPMethod.fromString(request.method);
  };

  public readonly toString = () => this.props.name;
}

export class UnknownHTTPMethod extends Error {
  private constructor(attemptedValue: string) {
    super(`HTTP method "${attemptedValue}" is unknown.`);
  }

  public static readonly duringStringConversion = (attemptedValue: string) =>
    new UnknownHTTPMethod(attemptedValue);
}
