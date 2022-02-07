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

import { createRef } from "../../framework/createRef.ts";
import { createEventBus, Subscriber } from "../../framework/createEventBus.ts";
import { createStrategy } from "../../framework/createStrategy.ts";

import { DomainEvent } from "../domain/events/DomainEvent.ts";
import { Node } from "../domain/model/Node.ts";

import { makeReplayRequest } from "./service/replayRequest.ts";
import { makeCaptureRequest } from "./service/captureRequest.ts";

export const makeStrawman = (deps: {
  urlOfProxiedService: URL;
  virtualServiceTree: null | Node;
  subscribers: Subscriber<DomainEvent>[];
}) => {
  const virtualServiceTreeRef = createRef(deps.virtualServiceTree);
  const eventBus = createEventBus<DomainEvent>();

  deps.subscribers.forEach(eventBus.subscribe);

  const requestHandler = createStrategy({
    replay: makeReplayRequest({
      eventBus,
      virtualServiceTreeRef,
    }),
    capture: makeCaptureRequest({
      eventBus,
      virtualServiceTreeRef,
      urlOfProxiedService: deps.urlOfProxiedService,
    }),
  });

  const strawman = Object.freeze({
    virtualServiceTreeRef,
    eventBus,
    setMode: requestHandler.set,
    handleRequest: (request: Request) =>
      requestHandler.current!({ aRequest: request }),
  });

  return strawman;
};
