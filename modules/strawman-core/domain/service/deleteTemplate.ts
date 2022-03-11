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
 */

import type { EventBus } from "../../../framework/createEventBus.ts";
import { createConstraints } from "../../../framework/createConstraints.ts";

import { DomainEvent } from "../events/DomainEvent.ts";
import { Path } from "../model/Path.ts";
import { Node } from "../model/Node.ts";
import { HTTPMethod } from "../model/HTTPMethod.ts";
import { Template } from "../model/Template.ts";

export const DeleteTemplateConstraints = createConstraints("DeleteTemplate");

export type IDeleteTemplate = (given: {
  aRootNode: Node;
  anHTTPMethod: HTTPMethod;
  aPath: Path;
}) => Node;

export const makeDeleteTemplate = (
  deps: { eventBus: EventBus<DomainEvent> },
): IDeleteTemplate => {
  const deleteTemplate: IDeleteTemplate = (given) => {
    let template: Template | null = null;
    const nextRootNode = given.aRootNode.modifyAtPath(
      given.aPath,
      (node) => {
        template = node.getTemplateForHTTPMethod(given.anHTTPMethod)!;

        DeleteTemplateConstraints.check({
          [`Template for HTTPMethod "${given.anHTTPMethod.toString()}" at path "${given.aPath.toString()}" must exist`]:
            template !== null,
        });

        return node.withoutTemplateForHTTPMethod(given.anHTTPMethod);
      },
    );

    deps.eventBus.dispatch(DomainEvent.TemplateWasDeleted({
      rootNode: nextRootNode,
      httpMethod: given.anHTTPMethod,
      path: given.aPath,
      template: template!,
    }));

    return nextRootNode;
  };

  return deleteTemplate;
};
