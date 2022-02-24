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

import { makeValidator, Validator } from "../model/Validator.ts";

export const record = <R extends Record<string, unknown>>(
  definition: { [K in keyof R]: Validator<R[K]> },
) =>
  makeValidator<R>(
    function* (value) {
      if (value === null) {
        return yield (path) =>
          `Expected ${path} to be a record, but it was null.`;
      }
      if (typeof value !== "object") {
        return yield (path) =>
          `Expected ${path} to be a record, but it was ${typeof value}.`;
      }
      if (
        Object.keys(value).length <
          Object.keys(definition).filter((key) => !definition[key].isOptional)
            .length
      ) {
        return yield (path) =>
          `${path} has fewer keys than expected. Got ${
            JSON.stringify(Object.keys(value))
          }, expected ${JSON.stringify(Object.keys(definition))}`;
      }
      if (Object.keys(value).length > Object.keys(definition).length) {
        return yield (path) =>
          `${path} has more keys than expected. Got ${
            JSON.stringify(Object.keys(value))
          }, expected ${JSON.stringify(Object.keys(definition))}`;
      }

      for (const [key, validator] of Object.entries(definition)) {
        if (!(key in value) && !validator.isOptional) {
          yield (path) =>
            `Expected ${path} to have key "${key}", but it was not found.`;
        }

        for (
          const messageFactory of validator.analyze(
            (value as Record<string, unknown>)[key],
          )
        ) {
          yield (path) => messageFactory(`${path}.${key}`);
        }
      }
    },
  );
