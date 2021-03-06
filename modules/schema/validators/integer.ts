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

const _integer = makeValidator<number>(
  function* (value) {
    if (typeof value === "number") {
      if (!Number.isInteger(value)) {
        yield (path: string) =>
          `Expected ${path} to be an integer, got "${value}" instead.`;
      }
    } else {
      yield (path: string) =>
        `Expected ${path} to be an integer, got "${typeof value}" instead.`;
    }
  },
);

export const integer = () => _integer;
