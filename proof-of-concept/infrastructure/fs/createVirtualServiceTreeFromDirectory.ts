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

import * as path from "https://deno.land/std/path/mod.ts";

import { Node } from "../../domain/model/Node.ts";
import { NodeName } from "../../domain/model/NodeName.ts";
import { HTTPMethod } from "../../domain/model/HTTPMethod.ts";
import { importTemplate } from "./importTemplate.ts";

export const createVirtualServiceTreeFromDirectory = async (
  pathToDirectory: string
): Promise<Node> => {
  let rootNode = Node.root();

  for await (const file of Deno.readDir(pathToDirectory)) {
    rootNode = await createChildNodesAndSnapshotsFromDirEntry(
      file,
      pathToDirectory,
      rootNode
    );
  }

  return rootNode;
};

const createChildNodesAndSnapshotsFromDirEntry = async (
  dirEntry: Deno.DirEntry,
  pathToDirectory: string,
  parentNode: Node
): Promise<Node> => {
  if (dirEntry.isDirectory) {
    const nextPathToDirectory = path.join(pathToDirectory, dirEntry.name);

    for await (const file of Deno.readDir(nextPathToDirectory)) {
      parentNode = parentNode.withAddedChild(
        await createChildNodesAndSnapshotsFromDirEntry(
          file,
          nextPathToDirectory,
          Node.withName(NodeName.fromString(dirEntry.name))
        )
      );
    }
  }

  if (dirEntry.isFile && dirEntry.name.endsWith(".mock.ts")) {
    parentNode = parentNode.withAddedTemplate(
      HTTPMethod.fromString(dirEntry.name.split(".")[0]!),
      await importTemplate(path.join(pathToDirectory, dirEntry.name))
    );
  }

  return parentNode;
};
