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

import * as path from "../../../../deps/path.ts";

import { castError } from "../../../framework/castError.ts";
import { Exception } from "../../../framework/exception.ts";

import { Node } from "../../domain/model/Node.ts";
import { NodeName } from "../../domain/model/NodeName.ts";
import { HTTPMethod } from "../../domain/model/HTTPMethod.ts";
import { IImportTemplate } from "./importTemplate.ts";

export type ICreateVirtualServiceTreeFromDirectory = ReturnType<
  typeof makeCreateVirtualServiceTreeFromDirectory
>;

export const makeCreateVirtualServiceTreeFromDirectory = (deps: {
  importTemplate: IImportTemplate;
}) => {
  const createVirtualServiceTreeFromDirectory = async (
    pathToDirectory: string,
  ): Promise<Node> => {
    let rootNode = Node.blank();

    try {
      const stat = await Deno.stat(pathToDirectory);
      if (!stat.isDirectory) {
        throw Exception.raise({
          code: 1641472651,
          message: `"${pathToDirectory}" is not a directory.`,
        });
      }
    } catch (err) {
      throw Exception.raise({
        code: 1641392680,
        message: `Directory "${pathToDirectory}" could not be read.`,
        cause: castError(err),
      });
    }

    for await (const file of Deno.readDir(pathToDirectory)) {
      if (file.isDirectory) {
        try {
          rootNode = rootNode.withAddedChild(
            NodeName.fromString(file.name),
            await createVirtualServiceTreeFromDirectory(
              path.join(pathToDirectory, file.name),
            ),
          );
        } catch (err) {
          throw Exception.raise({
            code: 1641392588,
            message: `Could not create child node "${file.name}".`,
            cause: castError(err),
          });
        }
      }

      if (file.isFile && file.name.endsWith(".mock.ts")) {
        const pathToTemplate = path.join(pathToDirectory, file.name);

        try {
          rootNode = rootNode.withTemplateForHTTPMethod(
            HTTPMethod.fromString(file.name.split(".")[0]!),
            await deps.importTemplate(
              pathToTemplate,
            ),
          );
        } catch (err) {
          throw Exception.raise({
            code: 1641392740,
            message: `Template "${pathToTemplate}" could not be imported.`,
            cause: castError(err),
          });
        }
      }
    }

    return rootNode;
  };

  return createVirtualServiceTreeFromDirectory;
};
