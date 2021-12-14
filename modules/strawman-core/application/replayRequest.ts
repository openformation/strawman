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

import { createRef } from "../../framework/createRef.ts";
import { createEventBus, Subscriber } from "../../framework/createEventBus.ts";

import { DomainEvent } from "../domain/events/DomainEvent.ts";
import { HTTPMethod } from "../domain/model/HTTPMethod.ts";
import { NodePath } from "../domain/model/NodePath.ts";
import { Node } from "../domain/model/Node.ts";
import { getTemplate } from "../domain/service/getTemplate.ts";
import { makeModifyTemplate } from "../domain/service/modifyTemplate.ts";

import { makeWatchForChanges } from "../infrastructure/fs/watchForChanges.ts";
import { makeImportTemplate } from "../infrastructure/fs/importTemplate.ts";

type IReplayRequest = (given: { aRequest: Request }) => Promise<RReplayRequest>;
type RReplayRequest =
  | {
      type: "SUCCESS: Request was replayed from template";
      value: Response;
    }
  | {
      type: "ERROR: Template was not found";
      value: Response;
    };

export const makeReplayRequest = (deps: {
  virtualServiceTree: null | Node;
  isEditingEnabled: boolean;
  pathToDirectory: string;
  subscribers: Subscriber<DomainEvent>[];
}): IReplayRequest => {
  const virtualServiceTreeRef = createRef(deps.virtualServiceTree);
  const eventBus = createEventBus<DomainEvent>();

  deps.subscribers.forEach(eventBus.subscribe);

  if (deps.isEditingEnabled) {
    const watchForChanges = makeWatchForChanges({
      pathToDirectory: deps.pathToDirectory,
      modifyTemplate: makeModifyTemplate({ eventBus }),
      importTemplate: makeImportTemplate({
        import: (pathToTemplateFile) => import(pathToTemplateFile),
        timer: Date.now,
      }),
      virtualServiceTreeRef,
    });

    watchForChanges();
  }

  const replayRequest: IReplayRequest = async (given) => {
    const httpMethodFromRequest = HTTPMethod.ofRequest(given.aRequest);
    const requestUrl = new URL(given.aRequest.url);

    if (virtualServiceTreeRef.current !== null) {
      const template = getTemplate({
        aRootNode: virtualServiceTreeRef.current,
        aPath: NodePath.fromString(requestUrl.pathname),
        anHTTPMethod: httpMethodFromRequest,
      });

      if (template !== null) {
        return {
          type: "SUCCESS: Request was replayed from template",
          value: await template.generateResponse(given.aRequest),
        };
      }
    }

    return {
      type: "ERROR: Template was not found",
      value: new Response("Not found", { status: 404 }),
    };
  };

  return replayRequest;
};
