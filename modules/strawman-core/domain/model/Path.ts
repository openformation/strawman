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

import { PathSegment } from "./PathSegment.ts";

import { createConstraints } from "../../../framework/createConstraints.ts";

const instances: Record<string, Path> = {};

export const PathConstraints = createConstraints("Path");

export class Path {
  private constructor(
    private readonly props: {
      segments: PathSegment[];
    },
  ) {}

  public static readonly root = new Path({ segments: [] });

  public static readonly fromString = (pathAsString: string) => {
    if (pathAsString === "/") {
      return Path.root;
    }

    if (instances[pathAsString]) {
      return instances[pathAsString];
    }

    PathConstraints.check({
      ["`pathAsString` must start with a '/'"]: pathAsString.startsWith(
        "/",
      ),
      ["`pathAsString` must not end with a '/' (except it is the root path)"]:
        !pathAsString.endsWith("/"),
    });

    const [, ...segmentsAsStrings] = pathAsString.split("/");

    instances[pathAsString] = new Path({
      segments: segmentsAsStrings.map(PathSegment.fromString),
    });

    return instances[pathAsString];
  };

  public readonly [Symbol.iterator] = () =>
    (function* ({ props }) {
      for (const segment of props.segments) {
        yield segment;
      }
    })(this);

  public readonly append = (segment: PathSegment) => {
    const path = this === Path.root
      ? `/${segment.toString()}`
      : `${this.toString()}/${segment.toString()}`;

    if (instances[path]) {
      return instances[path];
    }

    instances[path] = new Path({
      segments: [...this.props.segments, segment],
    });

    return instances[path];
  };

  public readonly toString = () =>
    `/${this.props.segments.map((segment) => segment.toString()).join("/")}`;
}
