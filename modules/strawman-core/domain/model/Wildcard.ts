/**
 * strawman - A Deno-based service virtualization solution
 * Copyright (C) 2022 Open Formation GmbH
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

import { Argument } from "./Argument.ts";
import { NodeName } from "./NodeName.ts";
import { Node } from "./Node.ts";

export class Wildcard {
  private constructor(
    private readonly props: {
      readonly name: string;
      readonly node: Node;
    }
  ) {}

  public static readonly create = (name: string, node: Node) =>
    new Wildcard({ name, node });

  public readonly getNode = () => this.props.node;

  public readonly makeArgument = (value: NodeName) =>
    Argument.create(NodeName.fromString(this.props.name), value.toString());
}
