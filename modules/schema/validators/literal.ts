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

import { makeValidator } from "../model/Validator.ts";

export const literal = <L extends number | string | boolean>(literal: L) =>
  makeValidator<L>(
    function* (value) {
      if (value !== literal) {
        switch (true) {
          case typeof value === "string" && value.length < 20:
          case typeof value === "number":
          case typeof value === "boolean":
            yield (path) =>
              `Expected ${path} to be "${literal}", got "${value}" instead.`;
            break;
          default:
            yield (path) =>
              `Expected ${path} to be "${literal}", got ${typeof value} instead.`;
            break;
        }
      }
    },
  );
