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

import * as path from "../../../../deps/path.ts";

import { castError } from "../../../framework/castError.ts";
import { Failure, failure, success } from "../../../framework/result.ts";

import { Node } from "../../domain/model/Node.ts";
import { NodeName } from "../../domain/model/NodeName.ts";
import { HTTPMethod } from "../../domain/model/HTTPMethod.ts";
import { IImportTemplate, RImportTemplate } from "./importTemplate.ts";

export type RCreateVirtualServiceTreeFromDirectory =
  | {
      type: "SUCCESS: Virtual service tree was created";
      value: Node;
    }
  | {
      type: "ERROR: Template could not be imported";
      cause: Failure<RImportTemplate>;
    }
  | {
      type: "ERROR: Directory could not be read";
      cause: Error;
    };

export type ICreateVirtualServiceTreeFromDirectory = (
  pathToDirectory: string
) => Promise<RCreateVirtualServiceTreeFromDirectory>;

export const makeCreateVirtualServiceTreeFromDirectory = (deps: {
  importTemplate: IImportTemplate;
}): ICreateVirtualServiceTreeFromDirectory => {
  const createVirtualServiceTreeFromDirectory: ICreateVirtualServiceTreeFromDirectory =
    async (pathToDirectory) => {
      let result: RCreateVirtualServiceTreeFromDirectory = {
        type: "SUCCESS: Virtual service tree was created",
        value: Node.blank(),
      };

      try {
        for await (const file of Deno.readDir(pathToDirectory)) {
          if (result.type !== "SUCCESS: Virtual service tree was created")
            break;

          if (file.isDirectory) {
            const createChildNodeResult =
              await createVirtualServiceTreeFromDirectory(
                path.join(pathToDirectory, file.name)
              );

            for (const { value: childNode } of success(createChildNodeResult)) {
              result = {
                type: "SUCCESS: Virtual service tree was created",
                value: result.value.withAddedChild(
                  NodeName.fromString(file.name),
                  childNode
                ),
              };
            }

            for (const cause of failure(createChildNodeResult)) {
              return cause;
            }
          }

          if (file.isFile && file.name.endsWith(".mock.ts")) {
            const importTemplateResult = await deps.importTemplate(
              path.join(pathToDirectory, file.name)
            );

            for (const { value: template } of success(importTemplateResult)) {
              result = {
                type: "SUCCESS: Virtual service tree was created",
                value: result.value.withTemplateForHTTPMethod(
                  HTTPMethod.fromString(file.name.split(".")[0]!),
                  template
                ),
              };
            }

            for (const cause of failure(importTemplateResult)) {
              return {
                type: "ERROR: Template could not be imported",
                cause,
              };
            }
          }
        }
      } catch (err) {
        return {
          type: "ERROR: Directory could not be read",
          cause: castError(err),
        };
      }

      return result;
    };

  return createVirtualServiceTreeFromDirectory;
};
