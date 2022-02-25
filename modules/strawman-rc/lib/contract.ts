/**
 * strawman - A Deno-based service virtualization solution
 * Copyright (C) 2022 Open Formation GmbH
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

import { createJsonRpcContract } from "../../jsonrpc/mod.ts";

export const contract = createJsonRpcContract((s) => ({
  /**
   * @description
   * Receive logs from a running strawman instance
   */
  logs: {
    result: [s.string()],
  },

  /**
   * @description
   * Delete an existing template
   */
  delete: {
    params: s.record({
      method: s.union(
        s.literal("GET"),
        s.literal("HEAD"),
        s.literal("POST"),
        s.literal("PUT"),
        s.literal("DELETE"),
        s.literal("OPTIONS"),
        s.literal("PATCH"),
      ),
      path: s.string(),
    }),
    result: s.boolean(),
  },

  /**
   * @description
   * Set the strawman mode of a running strawman instance
   */
  setMode: {
    params: s.record({
      mode: s.union(s.literal("replay"), s.literal("capture")),
    }),
    result: s.boolean(),
  },
}));
