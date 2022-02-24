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

export type Signal<T> = AsyncIterable<T> & {
  send: (value: T) => void;
};

export const createSignal = <T>(): Signal<T> => {
  const buffer: T[] = [];
  let deferredResolve: null | ((value: T) => void) = null;

  return {
    send: (value: T) => {
      deferredResolve ? deferredResolve(value) : buffer.push(value);
    },
    [Symbol.asyncIterator]: () => ({
      next: () => {
        if (buffer.length) {
          return Promise.resolve({ value: buffer.shift()!, done: false });
        } else {
          return new Promise<{ value: T; done: false }>((resolve) => {
            deferredResolve = (value: T) => {
              deferredResolve = null;
              resolve({ value, done: false });
            };
          });
        }
      },
    }),
  };
};
