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

import type { Infer, Validator } from "../../schema/mod.ts";

import type { JsonRpcContract } from "./JsonRpcContract.ts";

type InferResultType<R extends Validator<unknown> | [Validator<unknown>]> =
  R extends [Validator<infer Result>] ? AsyncIterable<Result>
    : R extends Validator<infer Result> ? Promise<Result>
    : never;

export type JsonRpcClient<Contract extends JsonRpcContract> = {
  [K in keyof Contract]: Infer<Contract[K]["params"]> extends never
    ? () => InferResultType<Contract[K]["result"]>
    : (
      params: Infer<Contract[K]["params"]>,
    ) => InferResultType<Contract[K]["result"]>;
};
