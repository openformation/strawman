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

import { DomainEvent } from "../../domain/events/DomainEvent.ts";
import { HTTPMethod } from "../../domain/model/HTTPMethod.ts";
import { Path } from "../../domain/model/Path.ts";
import { Node } from "../../domain/model/Node.ts";
import { route } from "../../domain/service/route.ts";

export type IReplayRequest = ReturnType<typeof makeReplayRequest>;

export const makeReplayRequest = (deps: {
  virtualServiceTreeRef: Ref<Node>;
  eventBus: EventBus<DomainEvent>;
}) => {
  const replayRequest = async (given: { aRequest: Request }) => {
    const httpMethodFromRequest = HTTPMethod.ofRequest(given.aRequest);
    const requestUrl = new URL(given.aRequest.url);

    if (deps.virtualServiceTreeRef.current !== null) {
      const routingResult = route({
        aRootNode: deps.virtualServiceTreeRef.current,
        aPath: Path.fromString(requestUrl.pathname),
        anHTTPMethod: httpMethodFromRequest,
      });

      if (routingResult !== null) {
        const [template, args] = routingResult;

        return await template.generateResponse(given.aRequest, args.toRecord());
      }
    }

    throw Exception.raise({
      code: 1641473907,
      message: "Template was not found.",
    });
  };

  return replayRequest;
};
