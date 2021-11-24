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

import { HTTPMethod } from "../domain/model/HTTPMethod.ts";
import { Snapshot } from "../domain/model/Snapshot.ts";
import { Node } from "../domain/model/Node.ts";
import { Event } from "../domain/event.ts";
import { makeCreateTree } from "../domain/service/createTree.ts";
import { makeAddSnapshot } from "../domain/service/addSnapshot.ts";
import { getSnapshot } from "../domain/service/getSnapshot.ts";

export const makeCaptureRequest = (deps: {
  urlOfProxiedService: URL;
  virtualServiceTree: null | Node;
  subscribers: Subscriber<Event>[];
}) => {
  const eventBus = createEventBus<Event>();
  const createTree = makeCreateTree({ eventBus });
  const addSnapshot = makeAddSnapshot({ eventBus });

  deps.subscribers.forEach(eventBus.subscribe);

  let vst = deps.virtualServiceTree;

  return async (request: Request) => {
    const httpMethod = HTTPMethod.ofRequest(request);
    const requestUrl = new URL(request.url);
    const proxyUrl = new URL(deps.urlOfProxiedService.toString());
    proxyUrl.pathname = requestUrl.pathname;

    if (vst === null) vst = createTree();

    let snapshot = getSnapshot(vst, requestUrl.pathname, httpMethod);
    if (snapshot === null) {
      snapshot = await Snapshot.fromFetchResponse(
        await fetch(proxyUrl.toString(), {
          method: request.method,
        })
      );
      vst = addSnapshot(vst, requestUrl.pathname, httpMethod, snapshot);
    }

    return snapshot.toFetchResponse();
  };
};
