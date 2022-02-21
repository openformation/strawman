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

import { createConstraints } from "../../../framework/createConstraints.ts";

import { Path } from "./Path.ts";
import { PathSegment } from "./PathSegment.ts";
import { HTTPMethod } from "./HTTPMethod.ts";
import { Template } from "./Template.ts";
import { Wildcard } from "./Wildcard.ts";

export const NodeConstraints = createConstraints("Node");

const modifyNodeRecursively = (
  node: Node,
  pathSegments: PathSegment[],
  modifierFn: (node: Node) => Node,
): Node => {
  const [head, ...tail] = pathSegments;
  if (head) {
    const child = node.getChild(head);
    NodeConstraints.check({
      [`Node "${head.toString()}" must exist`]: child !== null,
    });

    return node.withAddedChild(
      head,
      modifyNodeRecursively(child!, tail, modifierFn),
    );
  } else {
    return modifierFn(node);
  }
};

export class Node {
  private constructor(
    private readonly props: {
      readonly templates: Record<string, Template>;
      readonly children: Record<string, Node>;
      readonly wildcard: null | Wildcard;
    },
  ) {}

  public static readonly blank = () =>
    new Node({
      templates: {},
      children: {},
      wildcard: null,
    });

  public readonly getTemplateForHTTPMethod = (
    httpMethod: HTTPMethod,
  ): null | Template => this.props.templates[httpMethod.toString()] ?? null;

  public readonly withTemplateForHTTPMethod = (
    httpMethod: HTTPMethod,
    template: Template,
  ) =>
    new Node({
      ...this.props,
      templates: { ...this.props.templates, [httpMethod.toString()]: template },
    });

  public readonly getChild = (pathSegment: PathSegment): null | Node =>
    this.props.children[pathSegment.toString()] ?? null;

  public readonly withoutTemplateForHTTPMethod = (httpMethod: HTTPMethod) => {
    const { [httpMethod.toString()]: _, ...templates } = this.props.templates;
    return new Node({ ...this.props, templates });
  };

  public readonly withAddedChild = (
    pathSegment: PathSegment,
    addedChild: Node,
  ) =>
    new Node({
      ...this.props,
      children: {
        ...this.props.children,
        [pathSegment.toString()]: addedChild,
      },
    });

  public readonly modifyAtPath = (
    path: Path,
    modifierFn: (node: Node) => Node,
  ): Node => modifyNodeRecursively(this, [...path], modifierFn);

  public readonly getWildcard = () => this.props.wildcard;

  public readonly withWildcard = (wildcard: Wildcard) =>
    new Node({
      ...this.props,
      wildcard,
    });
}
