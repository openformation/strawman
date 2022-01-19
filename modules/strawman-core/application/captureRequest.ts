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

import { createEventBus, Subscriber } from "../../framework/createEventBus.ts";
import { Exception } from "../../framework/exception.ts";

import { HTTPMethod } from "../domain/model/HTTPMethod.ts";
import { Snapshot } from "../domain/model/Snapshot.ts";
import { NodePath } from "../domain/model/NodePath.ts";
import { Node } from "../domain/model/Node.ts";
import { DomainEvent } from "../domain/events/DomainEvent.ts";
import { makeCreateTree } from "../domain/service/createTree.ts";
import { makeAddSnapshot } from "../domain/service/addSnapshot.ts";
import { getTemplate } from "../domain/service/getTemplate.ts";

export type ICaptureRequest = ReturnType<typeof makeCaptureRequest>;

export const makeCaptureRequest = (deps: {
  urlOfProxiedService: URL;
  virtualServiceTree: null | Node;
  subscribers: Subscriber<DomainEvent>[];
}) => {
  const eventBus = createEventBus<DomainEvent>();
  const createTree = makeCreateTree({ eventBus });
  const addSnapshot = makeAddSnapshot({ eventBus });

  deps.subscribers.forEach(eventBus.subscribe);

  let rootNode = deps.virtualServiceTree;

  const captureRequest = async (given: { aRequest: Request }) => {
    const requestUrl = new URL(given.aRequest.url);
    const proxyUrl = new URL(deps.urlOfProxiedService.toString());
    proxyUrl.pathname = requestUrl.pathname;

    const httpMethodFromRequest = HTTPMethod.ofRequest(given.aRequest);
    const nodePathFromRequest = NodePath.fromString(requestUrl.pathname);

    if (rootNode === null) rootNode = createTree();

    let [template, arguments] = getTemplate({
      aRootNode: rootNode,
      aPath: nodePathFromRequest,
      anHTTPMethod: httpMethodFromRequest,
    });
    if (template === null) {
      const snapshot = await Snapshot.fromFetchResponse(
        await fetch(proxyUrl.toString(), {
          method: given.aRequest.method,
          headers: given.aRequest.headers,
        })
      );
      rootNode = addSnapshot({
        aRootNode: rootNode,
        aPath: nodePathFromRequest,
        aSnapShot: snapshot,
        anHTTPMethod: httpMethodFromRequest,
      });
      [template, arguments] = getTemplate({
        aRootNode: rootNode,
        aPath: nodePathFromRequest,
        anHTTPMethod: httpMethodFromRequest,
      });
    }

    if (template === null) {
      throw Exception.raise({
        code: 1641473616,
        message: "Template could not be written",
      });
    }

    return await template.generateResponse(
      given.aRequest,
      arguments.toRecord()
    );
  };

  return captureRequest;
};
