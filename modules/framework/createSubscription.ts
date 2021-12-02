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

type EventShape<
  Type extends string = string,
  Payload extends Record<string, unknown> = Record<string, unknown>
> = {
  type: Type;
  payload: Payload;
};

type Handler<E extends EventShape> = (event: E) => void | Promise<void>;

export const createSubscription = <Event extends EventShape>() => {
  const handlers = new Map<Event["type"], Handler<Event>>();
  const subscriber = (event: Event) => handlers.get(event.type)?.(event);

  subscriber.on = <T extends Event["type"]>(
    eventType: T,
    handler: (event: Extract<Event, { type: T }>) => void | Promise<void>
  ) => {
    handlers.set(eventType, handler as Handler<Event>);
    return subscriber;
  };

  return subscriber;
};
