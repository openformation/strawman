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

import { makeValidator, Validator } from "../model/Validator.ts";

export const union = <M extends Array<unknown>>(
  ...members: { [K in keyof M]: Validator<M[K]> }
) =>
  makeValidator<{ [K in keyof M]: M[K] }[number]>(
    function* (value) {
      for (const member of members) {
        if (member.validate(value)) return;
      }

      yield (path) => {
        const result = [`None of the union members matched for ${path}: `];

        for (const member of members) {
          for (const messageFactory of member.analyze(value)) {
            result.push(`  ${messageFactory(path)}`);
          }
        }

        return result.join("\n");
      };
    },
  );
