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

import { HTTPMethod } from "../domain/model/HTTPMethod.ts";
import { Node } from "../domain/model/Node.ts";
import { getTemplate } from "../domain/service/getTemplate.ts";

export const makeReplayRequest = (deps: {
  virtualServiceTree: null | Node;
}) => {
  return (request: Request) => {
    const httpMethod = HTTPMethod.ofRequest(request);
    const requestUrl = new URL(request.url);

    if (deps.virtualServiceTree !== null) {
      const template = getTemplate(
        deps.virtualServiceTree,
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
