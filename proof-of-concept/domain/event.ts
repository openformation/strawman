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

import { Node } from "./model/Node.ts";
import { NodePath } from "./model/NodePath.ts";
import { HTTPMethod } from "./model/HTTPMethod.ts";
import { Snapshot } from "./model/Snapshot.ts";
import { Template } from "./model/Template.ts";

export enum EventType {
  TREE_WAS_CREATED,
  TREE_WAS_REMOVED,
  NODE_WAS_ADDED,
  NODE_WAS_REMOVED,
  SNAPSHOT_WAS_ADDED,
  SNAPSHOT_WAS_REMOVED,
  SNAPSHOT_WAS_MODIFIED,
  TEMPLATE_WAS_MODIFIED
}

export type Event =
  | {
      type: EventType.TREE_WAS_CREATED;
      payload: { tree: Node };
    }
  | {
      type: EventType.TREE_WAS_REMOVED;
      payload: { tree: Node };
    }
  | {
      type: EventType.NODE_WAS_ADDED;
      payload: { tree: Node; nodePath: NodePath; node: Node };
    }
  | {
      type: EventType.NODE_WAS_REMOVED;
      payload: { tree: Node; nodePath: NodePath; node: Node };
    }
  | {
      type: EventType.SNAPSHOT_WAS_ADDED;
      payload: {
        tree: Node;
        nodePath: NodePath;
        node: Node;
        httpMethod: HTTPMethod;
        snapshot: Snapshot;
      };
    }
  | {
      type: EventType.SNAPSHOT_WAS_REMOVED;
      payload: {
        tree: Node;
        nodePath: NodePath;
        node: Node;
        httpMethod: HTTPMethod;
        snapshot: Snapshot;
      };
    }
  | {
      type: EventType.SNAPSHOT_WAS_MODIFIED;
      payload: {
        tree: Node;
        nodePath: NodePath;
        node: Node;
        httpMethod: HTTPMethod;
        oldSnapshot: Snapshot;
        newSnapshot: Snapshot;
      };
    }
  | {
      type: EventType.TEMPLATE_WAS_MODIFIED;
      payload: {
        tree: Node;
        nodePath: NodePath;
        node: Node;
        httpMethod: HTTPMethod;
        template: Template
      };
    };
