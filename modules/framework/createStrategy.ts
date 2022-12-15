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

import { createRef } from "./createRef.ts";

export const createStrategy = <M extends Record<string, unknown>>(
  mapOfAlternatives: M,
) => {
  const alternativeKeys = Object.keys(mapOfAlternatives);
  if (alternativeKeys.length === 0) {
    throw new Error("Map of alternatives must not be empty!");
  }

  const [initialAlternativeKey] = alternativeKeys;
  const alternativeKeyRef = createRef(initialAlternativeKey as keyof M);

  return Object.freeze({
    is: (alternativeKey: keyof M) =>
      alternativeKeyRef.current === alternativeKey,
    get current(): M[keyof M] {
      return mapOfAlternatives[alternativeKeyRef.current!] as M[keyof M];
    },
    set: (alternativeKey: keyof M) => {
      if (!alternativeKeys.includes(alternativeKey as string)) {
        throw new Error(`Unknown alternative: ${String(alternativeKey)}`);
      }

      alternativeKeyRef.current = alternativeKey;
    },
  });
};
