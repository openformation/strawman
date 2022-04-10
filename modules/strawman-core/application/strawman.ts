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

import { ILogger } from "../../strawman-logger/mod.ts";

import { DomainEvent } from "../domain/events/DomainEvent.ts";
import { Node } from "../domain/model/Node.ts";
import { Path } from "../domain/model/Path.ts";
import { HTTPMethod } from "../domain/model/HTTPMethod.ts";
import { makeDeleteTemplate } from "../domain/service/deleteTemplate.ts";

import { makeReplayRequest } from "./service/replayRequest.ts";
import { makeCaptureRequest } from "./service/captureRequest.ts";

import type { Manifest } from "./manifest.ts";

export type Strawman = ReturnType<typeof makeStrawman>;

export const makeStrawman = (deps: {
  urlOfProxiedService: URL;
  virtualServiceTree: null | Node;
  subscribers: Subscriber<DomainEvent>[];
  logger: ILogger;
  manifest: Manifest;
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
  const deleteTemplate = makeDeleteTemplate({
    eventBus,
  });

  const strawman = Object.freeze({
    virtualServiceTreeRef,
    eventBus,
    setMode: (mode: "replay" | "capture") => {
      if (!requestHandler.is(mode)) {
        requestHandler.set(mode);
        deps.logger.info(`Strawman is in ${mode} mode.`);
        return true;
      }

      return false;
    },
    handleRequest: (request: Request) => {
      const generateResponse = (deps.manifest.middlewares ?? []).reduce<
        () => Promise<Response>
      >(
        (acc, cur) => () => cur(request, acc),
        () => requestHandler.current!({ aRequest: request }),
      );

      return generateResponse();
    },
    deleteTemplate: (method: string, path: string) => {
      if (virtualServiceTreeRef.current !== null) {
        deleteTemplate({
          aRootNode: virtualServiceTreeRef.current,
          anHTTPMethod: HTTPMethod.fromString(method),
          aPath: Path.fromString(path),
        });
        return true;
      }

      return false;
    },
  });

  return strawman;
};
