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

import { createRef } from "../../framework/createRef.ts";

import { JsonRpcException } from "../model/JsonRpcError.ts";
import type { JsonRpcTransport } from "../model/JsonRpcTransport.ts";

const createBuffer = (socket: WebSocket) => {
  const buffer = new Set<() => void>();

  socket.addEventListener("open", () => {
    for (const send of buffer) {
      buffer.delete(send);
      send();
    }
  }, { once: true });

  return buffer;
};

export const createTransport = (configuration: {
  socket: WebSocket;
}): JsonRpcTransport => {
  const buffer = createBuffer(configuration.socket);
  const deferredPromiseHandleRef = createRef<{
    resolve: (value: IteratorResult<string>) => void;
    reject: (reason: unknown) => void;
  }>();

  const onMessage = (ev: MessageEvent) =>
    deferredPromiseHandleRef.current?.resolve({
      value: ev.data,
      done: false,
    });
  const onError = (ev: Event) =>
    deferredPromiseHandleRef.current?.reject(
      JsonRpcException.raiseInternal({
        code: -32603,
        message: "Internal error",
        data: {
          reason: (ev as ErrorEvent).message,
        },
      }),
    );
  const onClose = () =>
    deferredPromiseHandleRef.current?.resolve({ value: undefined, done: true });

  configuration.socket.addEventListener("message", onMessage);
  configuration.socket.addEventListener("error", onError);
  configuration.socket.addEventListener("close", onClose);

  return Object.freeze(
    <JsonRpcTransport> {
      send: (message) => {
        const send = () => configuration.socket.send(message);

        if (configuration.socket.readyState === WebSocket.OPEN) {
          send();
        } else {
          buffer.add(send);
        }
      },
      receive: () => ({
        [Symbol.asyncIterator]: () => ({
          next: () =>
            new Promise((resolve, reject) => {
              deferredPromiseHandleRef.current = { resolve, reject };
            }),
          return: () =>
            new Promise((resolve) => {
              configuration.socket.removeEventListener("message", onMessage);
              configuration.socket.removeEventListener("error", onError);
              configuration.socket.removeEventListener("close", onClose);

              resolve({ value: undefined, done: true });
            }),
        }),
      }),
    },
  );
};
