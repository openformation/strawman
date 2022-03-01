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

import type { EventBus } from "../../../framework/createEventBus.ts";
import { createConstraints } from "../../../framework/createConstraints.ts";

import { DomainEvent } from "../events/DomainEvent.ts";
import { PathSegment } from "../model/PathSegment.ts";
import { Path } from "../model/Path.ts";
import { Node } from "../model/Node.ts";
import { HTTPMethod } from "../model/HTTPMethod.ts";
import { Template } from "../model/Template.ts";

export const ModifyTemplateConstraints = createConstraints("ModifyTemplate");

export type IModifyTemplate = (given: {
  aRootNode: Node;
  aPath: Path;
  anHTTPMethod: HTTPMethod;
  theModifiedTemplate: Template;
}) => Node;

export const makeModifyTemplate = (deps: {
  eventBus: EventBus<DomainEvent>;
}): IModifyTemplate => {
  const modifyTemplate: IModifyTemplate = (given) => {
    const { anHTTPMethod: theHTTPMethod, theModifiedTemplate } = given;

    let theParentNode: null | Node = null;
    const modifyTemplateRecursively = (given: {
      aParentPath: Path;
      aParentNode: Node;
      remainingNodePathSegments: PathSegment[];
    }): Node => {
      const [head, ...tail] = given.remainingNodePathSegments;

      if (head) {
        const path = given.aParentPath.append(head);
        const node = given.aParentNode.getChild(head);
        ModifyTemplateConstraints.check({
          [`Node at path "${path.toString()}" must exist`]: node !== null,
        });

        if (tail.length) {
          return given.aParentNode.withAddedChild(
            head,
            modifyTemplateRecursively({
              aParentPath: path,
              aParentNode: node!,
              remainingNodePathSegments: tail,
            }),
          );
        } else {
          ModifyTemplateConstraints.check({
            [`Template for HTTPMethod "${theHTTPMethod.toString()}" at path "${path.toString()}" must exist`]:
              node!.getTemplateForHTTPMethod(theHTTPMethod) !== null,
          });

          theParentNode = node!.withTemplateForHTTPMethod(
            theHTTPMethod,
            theModifiedTemplate,
          );

          return given.aParentNode.withAddedChild(head, theParentNode!);
        }
      }

      ModifyTemplateConstraints.check({
        [`Template for HTTPMethod "${theHTTPMethod.toString()}" at path "${given.aParentPath.toString()}" must exist`]:
          given.aParentNode.getTemplateForHTTPMethod(theHTTPMethod) !== null,
      });

      theParentNode = given.aParentNode.withTemplateForHTTPMethod(
        theHTTPMethod,
        theModifiedTemplate,
      );

      return theParentNode;
    };

    const nextRootNode = modifyTemplateRecursively({
      aParentPath: Path.root,
      aParentNode: given.aRootNode,
      remainingNodePathSegments: [...given.aPath],
    });

    deps.eventBus.dispatch(
      DomainEvent.TemplateWasModified({
        rootNode: nextRootNode,
        path: given.aPath,
        parentNode: theParentNode!,
        httpMethod: given.anHTTPMethod,
        template: given.theModifiedTemplate,
      }),
    );

    return nextRootNode;
  };

  return modifyTemplate;
};
