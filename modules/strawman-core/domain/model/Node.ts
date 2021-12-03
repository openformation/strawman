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
import { HTTPMethod } from "./HTTPMethod.ts";
import { Template } from "./Template.ts";

export class Node {
  private constructor(
    private readonly props: {
      templates: Record<string, Template>;
      children: Record<string, Node>;
    }
  ) {}

  public static readonly blank = () =>
    new Node({
      templates: {},
      children: {},
    });

  public readonly getTemplateForHTTPMethod = (httpMethod: HTTPMethod) =>
    this.props.templates[httpMethod.toString()] ?? null;

  public readonly withTemplateForHTTPMethod = (
    httpMethod: HTTPMethod,
    template: Template
  ) =>
    new Node({
      ...this.props,
      templates: { ...this.props.templates, [httpMethod.toString()]: template },
    });

  public readonly getChild = (nodeName: NodeName): null | Node =>
    this.props.children[nodeName.toString()] ?? null;

  public readonly withAddedChild = (nodeName: NodeName, addedChild: Node) =>
    new Node({
      ...this.props,
      children: {
        ...this.props.children,
        [nodeName.toString()]: addedChild,
      },
    });
}
