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

import { createEventBus } from "../framework/createEventBus.ts";
import { castError } from "../framework/castError.ts";

import { LogEvent } from "./LogEvent.ts";
import { createErrorDTO } from "./ErrorDTO.ts";

export type ILogger = ReturnType<typeof createLogger>;

export const createLogger = () => {
  const eventBus = createEventBus<LogEvent>();

  return Object.freeze({
    info: (message: string) =>
      eventBus.dispatch(
        LogEvent.LogInfo({ message }),
      ),
    incoming: (message: string, data: { request: Request }) =>
      eventBus.dispatch(
        LogEvent.LogIncoming({ message, ...data }),
      ),
    outgoing: (
      message: string,
      data: { request: Request; response: Response },
    ) =>
      eventBus.dispatch(
        LogEvent.LogOutgoing({ message, ...data }),
      ),
    warning: (message: string) =>
      eventBus.dispatch(
        LogEvent.LogWarning({ message }),
      ),
    error: (errorOrMessage: unknown, data?: { request?: Request }) => {
      if (typeof errorOrMessage === "string") {
        eventBus.dispatch(
          LogEvent.LogError({
            error: {
              message: errorOrMessage as string,
              cause: null,
              trace: [],
            },
            request: data?.request,
          }),
        );
      } else {
        eventBus.dispatch(
          LogEvent.LogError({
            error: createErrorDTO(castError(errorOrMessage)),
            request: data?.request,
          }),
        );
      }
    },
    fatal: (errorOrMessage: unknown, data?: { request?: Request }) => {
      if (typeof errorOrMessage === "string") {
        eventBus.dispatch(
          LogEvent.LogFatal({
            error: {
              message: errorOrMessage as string,
              cause: null,
              trace: [],
            },
            request: data?.request,
          }),
        );
      } else {
        eventBus.dispatch(
          LogEvent.LogFatal({
            error: createErrorDTO(castError(errorOrMessage)),
            request: data?.request,
          }),
        );
      }
    },
    debug: (message: string) =>
      eventBus.dispatch(
        LogEvent.LogDebug({ message }),
      ),
    subscribe: eventBus.subscribe,
  });
};
