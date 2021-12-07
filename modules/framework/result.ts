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

type ResultShape<M extends string = string> =
  | { type: `SUCCESS: ${M}` }
  | { type: `ERROR: ${M}` };

export const success = function* <M extends string, R extends ResultShape<M>>(
  res: R
) {
  if (res.type.startsWith("SUCCESS: ")) {
    yield res as Extract<R, { type: `SUCCESS: ${M}` }>;
  }
};

export const failure = function* <M extends string, R extends ResultShape<M>>(
  res: R
) {
  if (res.type.startsWith("ERROR: ")) {
    yield res as Extract<R, { type: `ERROR: ${M}` }>;
  }
};
