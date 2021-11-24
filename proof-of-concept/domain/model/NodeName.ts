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

const instances: Record<string, NodeName> = {};

export class NodeName {
  private constructor(
    public readonly props: {
      readonly value: string;
    }
  ) {}

  public static readonly fromString = (string: string) => {
    const nodeName = instances[string];
    if (nodeName) {
      return nodeName;
    }

    const newNodeName = new NodeName({ value: string });
    instances[string] = newNodeName;

    return newNodeName;
  };

  public readonly toString = () => this.props.value;
}
