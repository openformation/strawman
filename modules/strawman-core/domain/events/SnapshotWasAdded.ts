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

import { HTTPMethod } from "../model/HTTPMethod.ts";
import { Snapshot } from "../model/Snapshot.ts";
import { Path } from "../model/Path.ts";
import { Node } from "../model/Node.ts";

export type SnapshotWasAdded = ReturnType<typeof SnapshotWasAdded>;

export const SnapshotWasAdded = (payload: {
  rootNode: Node;
  path: Path;
  parentNode: Node;
  httpMethod: HTTPMethod;
  addedSnaphot: Snapshot;
}) => ({
  type: "http://openformation.io/strawman/SnapshotWasAdded",
  payload,
} as const);
