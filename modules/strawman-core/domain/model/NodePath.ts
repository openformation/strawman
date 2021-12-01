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

import { NodeName } from "./NodeName.ts";

import { createConstraints } from "../../../framework/createConstraints.ts";

export const NodePathConstraints = createConstraints("NodePath");

export class NodePath {
  private constructor(
    private readonly props: {
      segments: NodeName[];
    }
  ) {}

  public static readonly fromNodeName = (nodeName: null | NodeName) =>
    new NodePath({
      segments: nodeName === null ? [] : [nodeName],
    });

  public static readonly fromString = (nodePathAsString: string) => {
    if (nodePathAsString === "/") {
      return new NodePath({ segments: [] });
    }

    NodePathConstraints.check({
      ["`nodePathAsString` must start with a '/'"]:
        nodePathAsString.startsWith("/"),
      ["`nodePathAsString` must not end with a '/' (except it is the root path)"]:
        !nodePathAsString.endsWith("/"),
    });

    const [, ...segmentsAsStrings] = nodePathAsString.split("/");

    return new NodePath({
      segments: segmentsAsStrings.map(NodeName.fromString),
    });
  };

  public readonly [Symbol.iterator] = () =>
    (function* ({ props }) {
      for (const segment of props.segments) {
        yield segment;
      }
    })(this);

  public readonly withAppendedSegment = (segment: NodeName) =>
    new NodePath({
      segments: [...this.props.segments, segment],
    });

  public readonly toString = () =>
    `/${this.props.segments.map((segment) => segment.toString()).join("/")}`;
}

export class NodePathCouldNotBeCreated extends Error {
  private constructor(reason: string) {
    super(`NodePath could not be created, because ${reason}`);
  }

  public static readonly ["`nodePathAsString` must start with a '/'"] = (
    attemptedValue: string
  ) =>
    new NodePathCouldNotBeCreated(
      `\`nodePathAsString\` "${attemptedValue}" must start with a "/"`
    );

  public static readonly ["`nodePathAsString` must not end with a '/'"] = (
    attemptedValue: string
  ) =>
    new NodePathCouldNotBeCreated(
      `\`nodePathAsString\` "${attemptedValue}" must not end with a "/"`
    );
}
