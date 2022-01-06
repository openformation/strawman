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

import { spy, assertSpyCall } from "../../deps-dev/mock.ts";

import { createJobQueue } from "./createJobQueue.ts";

Deno.test({
  name: "creates a job queue that performs synchronous jobs immediately.",
  fn: () => {
    const jobQueue = createJobQueue();
    const callback = spy();
    const createJob = (id: number) => () => callback(id);

    jobQueue.addJob(createJob(1));
    jobQueue.addJob(createJob(2));
    jobQueue.addJob(createJob(3));
    jobQueue.addJob(createJob(4));

    assertSpyCall(callback, 0, { args: [1] });
    assertSpyCall(callback, 1, { args: [2] });
    assertSpyCall(callback, 2, { args: [3] });
    assertSpyCall(callback, 3, { args: [4] });
  },
});

Deno.test({
  name: "creates a job queue that performs asynchronous jobs in the order they were added.",
  fn: async () => {
    const jobQueue = createJobQueue();
    const callback = spy();
    const createJob = (id: number, delayInMs: number) => () =>
      new Promise<void>((resolve) =>
        setTimeout(() => resolve(callback(id)), delayInMs)
      );

    jobQueue.addJob(createJob(1, 150));
    jobQueue.addJob(createJob(2, 100));
    jobQueue.addJob(createJob(3, 50));
    jobQueue.addJob(createJob(4, 320));

    await new Promise((resolve) => setTimeout(resolve, 700));

    assertSpyCall(callback, 0, { args: [1] });
    assertSpyCall(callback, 1, { args: [2] });
    assertSpyCall(callback, 2, { args: [3] });
    assertSpyCall(callback, 3, { args: [4] });
  },
});

Deno.test({
  name: "creates a job queue that performs a mixture of asynchronous and synchronous jobs in the order they were added.",
  fn: async () => {
    const jobQueue = createJobQueue();
    const callback = spy();
    const createSynchronousJob = (id: number) => () => callback(id);
    const createAsynchronousJob = (id: number, delayInMs: number) => () =>
      new Promise<void>((resolve) =>
        setTimeout(() => resolve(callback(id)), delayInMs)
      );

    jobQueue.addJob(createSynchronousJob(1));
    jobQueue.addJob(createAsynchronousJob(2, 120));
    jobQueue.addJob(createAsynchronousJob(3, 80));
    jobQueue.addJob(createSynchronousJob(4));
    jobQueue.addJob(createAsynchronousJob(5, 230));
    jobQueue.addJob(createSynchronousJob(6));
    jobQueue.addJob(createSynchronousJob(7));
    jobQueue.addJob(createAsynchronousJob(8, 175));

    await new Promise((resolve) => setTimeout(resolve, 700));

    assertSpyCall(callback, 0, { args: [1] });
    assertSpyCall(callback, 1, { args: [2] });
    assertSpyCall(callback, 2, { args: [3] });
    assertSpyCall(callback, 3, { args: [4] });
    assertSpyCall(callback, 4, { args: [5] });
    assertSpyCall(callback, 5, { args: [6] });
    assertSpyCall(callback, 6, { args: [7] });
    assertSpyCall(callback, 7, { args: [8] });
  },
});
