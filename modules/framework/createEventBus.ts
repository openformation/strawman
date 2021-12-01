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

type EventShape = {
  type: number;
  payload: Record<string, unknown>;
};

export type Subscriber<E extends EventShape> = (
  event: E
) => void | Promise<void>;

export type EventBus<E extends EventShape> = {
  dispatch: (event: E) => void;
  subscribe: (subscriber: Subscriber<E>) => () => void;
};

export const createEventBus = <E extends EventShape>(): EventBus<E> => {
  const subscribers = new Set<Subscriber<E>>();
  const dispatch = (event: E) =>
    subscribers.forEach((subscriber) => subscriber(event));
  const subscribe = (subscriber: Subscriber<E>) => {
    subscribers.add(subscriber);
    return () => subscribers.delete(subscriber);
  };

  return { dispatch, subscribe };
};
