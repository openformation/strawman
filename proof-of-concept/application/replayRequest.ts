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

import { createEventBus, Subscriber } from "../framework/createEventBus.ts";

import { Event } from "../domain/event.ts";
import { HTTPMethod } from "../domain/model/HTTPMethod.ts";
import { Node } from "../domain/model/Node.ts";
import { getTemplate } from "../domain/service/getTemplate.ts";

import { makeWatchForChanges } from "../infrastructure/fs/index.ts";

export const makeReplayRequest = (deps: {
  virtualServiceTree: null | Node;
  isEditingEnabled: boolean;
  pathToDirectory: string;
  subscribers: Subscriber<Event>[];
}) => {
  const eventBus = createEventBus<Event>();

  deps.subscribers.forEach(eventBus.subscribe);

  let virtualServiceTree = deps.virtualServiceTree;

  if (deps.isEditingEnabled) {
    const watchForChanges = makeWatchForChanges({
      pathToDirectory: deps.pathToDirectory,
      eventBus,
      onUpdate: (newVirtualServiceTree: Node) => {
        virtualServiceTree = newVirtualServiceTree;
      },
    });

    watchForChanges(() => virtualServiceTree);
  }

  return (request: Request) => {
    const httpMethod = HTTPMethod.ofRequest(request);
    const requestUrl = new URL(request.url);

    if (virtualServiceTree !== null) {
      const template = getTemplate(
        virtualServiceTree,
        requestUrl.pathname,
        httpMethod
      );

      if (template !== null) {
        return template.generateResponse(request);
      }
    }

    return new Response("Not found", { status: 404 });
  };
};
