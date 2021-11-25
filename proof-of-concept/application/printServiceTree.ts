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

import { Node } from "../domain/model/Node.ts";
import { NodeName } from "../domain/model/NodeName.ts";
import { HTTPMethod } from "../domain/model/HTTPMethod.ts";

export const printServiceTree = (rootNode: Node) =>
  rootNode.traverse((nodePath, node) => {
    const name = nodePath.reduce(
      (_, next) => next,
      undefined as undefined | NodeName
    );
    const depth = nodePath.reduce((sum) => sum + 1, 0);
    const methods: string[] = [];

    for (const httpMethod of HTTPMethod) {
      const snapshot = node.getTemplateForHTTPMethod(httpMethod);
      if (snapshot) {
        methods.push(httpMethod.toString());
      }
    }

    if (depth === 0) {
      console.log(`[ ${methods.join(" | ")} ] /`);
    } else {
      console.log(
        `${"  ".repeat(depth - 1)}[ ${methods.join(
          " | "
        )} ] /${name?.toString()}`
      );
    }
  });
