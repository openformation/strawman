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

type Job = () => void | Promise<void>;

export const createJobQueue = () => {
  let isWorking = false;
  const jobs = new Set<Job>();
  const addJob = (job: Job) => {
    const wrappedJob = async () => {
      isWorking = true;
      const task = job();
      if (Promise.resolve(task) === task) {
        await task;
      }
      isWorking = false;

      for (const remainingJob of jobs) {
        jobs.delete(remainingJob);
        const task = remainingJob();
        if (Promise.resolve(task) === task) {
          await task;
        }
        break;
      }
    };

    if (isWorking) {
      jobs.add(wrappedJob);
    } else {
      wrappedJob();
    }
  };

  return { addJob };
};
