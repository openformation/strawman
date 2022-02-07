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

import { Ref } from "../../../framework/createRef.ts";
import { EventBus } from "../../../framework/createEventBus.ts";
import { Exception } from "../../../framework/exception.ts";

import { HTTPMethod } from "../../domain/model/HTTPMethod.ts";
import { Snapshot } from "../../domain/model/Snapshot.ts";
import { Path } from "../../domain/model/Path.ts";
import { Node } from "../../domain/model/Node.ts";
import { DomainEvent } from "../../domain/events/DomainEvent.ts";
import { makeCreateTree } from "../../domain/service/createTree.ts";
import { makeAddSnapshot } from "../../domain/service/addSnapshot.ts";
import { route } from "../../domain/service/route.ts";

export type ICaptureRequest = ReturnType<typeof makeCaptureRequest>;

export const makeCaptureRequest = (deps: {
  urlOfProxiedService: URL;
  virtualServiceTreeRef: Ref<Node>;
  eventBus: EventBus<DomainEvent>;
}) => {
  const createTree = makeCreateTree({ eventBus: deps.eventBus });
  const addSnapshot = makeAddSnapshot({ eventBus: deps.eventBus });

  const captureRequest = async (given: { aRequest: Request }) => {
    const requestUrl = new URL(given.aRequest.url);
    const proxyUrl = new URL(deps.urlOfProxiedService.toString());
    proxyUrl.pathname = requestUrl.pathname;

    const httpMethodFromRequest = HTTPMethod.ofRequest(given.aRequest);
    const pathFromRequest = Path.fromString(requestUrl.pathname);

    if (deps.virtualServiceTreeRef.current === null) {
      deps.virtualServiceTreeRef.current = createTree();
    }

    let routingResult = route({
      aRootNode: deps.virtualServiceTreeRef.current,
      aPath: pathFromRequest,
      anHTTPMethod: httpMethodFromRequest,
    });
    if (routingResult === null) {
      const snapshot = await Snapshot.fromFetchResponse(
        await fetch(proxyUrl.toString(), {
          method: given.aRequest.method,
          headers: given.aRequest.headers,
        }),
      );
      deps.virtualServiceTreeRef.current = addSnapshot({
        aRootNode: deps.virtualServiceTreeRef.current,
        aPath: pathFromRequest,
        aSnapShot: snapshot,
        anHTTPMethod: httpMethodFromRequest,
      });
      routingResult = route({
        aRootNode: deps.virtualServiceTreeRef.current,
        aPath: pathFromRequest,
        anHTTPMethod: httpMethodFromRequest,
      });
    }

    if (routingResult === null) {
      throw Exception.raise({
        code: 1641473616,
        message: "Template could not be written",
      });
    }

    const [template, args] = routingResult;

    return await template.generateResponse(given.aRequest, args.toRecord());
  };

  return captureRequest;
};
