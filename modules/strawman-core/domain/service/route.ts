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

import { Node } from "../model/Node.ts";
import { Path } from "../model/Path.ts";
import { HTTPMethod } from "../model/HTTPMethod.ts";
import { Arguments } from "../model/Arguments.ts";
import { Template } from "../model/Template.ts";

export type RoutingResult = readonly [Template, Arguments];

export const route = (given: {
  aRootNode: Node;
  aPath: Path;
  anHTTPMethod: HTTPMethod;
}): null | RoutingResult => {
  let node: null | Node = given.aRootNode;
  let args: Arguments = Arguments.empty();

  for (const pathSegment of given.aPath) {
    const parent = node as Node;
    node = parent.getChild(pathSegment);
    if (node === null) {
      const wildcard = parent.getWildcard();
      if (wildcard === null) {
        return null;
      }

      node = wildcard.getNode();
      args = args.withAddedArgument(wildcard.makeArgument(pathSegment));
    }
  }

  const template = node!.getTemplateForHTTPMethod(given.anHTTPMethod);
  if (template === null) {
    return null;
  }

  return [template, args] as const;
};
