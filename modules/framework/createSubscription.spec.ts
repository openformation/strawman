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

import { spy, assertSpyCall, assertSpyCalls } from "../../deps-dev/mock.ts";

import { createEventBus } from "./createEventBus.ts";
import { createSubscription } from "./createSubscription.ts";

Deno.test({
  name: "provides a convenient way to create subscriptions for message catalogs",
  fn: () => {
    type MessageCatalog =
      | { type: "SomethingHappened"; payload: { foo: string } }
      | { type: "SomethingElseHappened"; payload: { bar: string } };

    const eventBus = createEventBus<MessageCatalog>();

    const handlers = [spy(), spy()] as const;
    const subscription = createSubscription<MessageCatalog>()
      .on("SomethingHappened", handlers[0])
      .on("SomethingElseHappened", handlers[1]);

    eventBus.subscribe(subscription);

    assertSpyCalls(handlers[0], 0);
    assertSpyCalls(handlers[1], 0);

    eventBus.dispatch({ type: "SomethingHappened", payload: { foo: "bar" } });
    assertSpyCalls(handlers[0], 1);
    assertSpyCalls(handlers[1], 0);
    assertSpyCall(handlers[0], 0, {
      args: [{ type: "SomethingHappened", payload: { foo: "bar" } }],
    });

    eventBus.dispatch({
      type: "SomethingElseHappened",
      payload: { bar: "foo" },
    });
    assertSpyCalls(handlers[0], 1);
    assertSpyCalls(handlers[1], 1);
    assertSpyCall(handlers[1], 0, {
      args: [{ type: "SomethingElseHappened", payload: { bar: "foo" } }],
    });
  },
});
