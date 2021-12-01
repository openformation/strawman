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

import { createConstraints } from "../../../framework/createConstraints.ts";

const instances: Record<string, NodeName> = {};

export const NodeNameConstraints = createConstraints("NodeName");

export class NodeName {
  private constructor(
    public readonly props: {
      readonly value: string;
    }
  ) {
    NodeNameConstraints.check({
      "must not be empty": this.props.value !== "",

      "must only contain characters safe to be used as a URI path segment (as per https://datatracker.ietf.org/doc/html/rfc3986#appendix-A)":
        /^[-_.~!$&'()*+,;=:@a-zA-Z0-9]+$/.test(this.props.value),
    });
  }

  public static readonly fromString = (nodeNameAsString: string) => {
    const nodeName = instances[nodeNameAsString];
    if (nodeName) {
      return nodeName;
    }

    const newNodeName = new NodeName({ value: nodeNameAsString });
    instances[nodeNameAsString] = newNodeName;

    return newNodeName;
  };

  public readonly toString = () => this.props.value;
}
