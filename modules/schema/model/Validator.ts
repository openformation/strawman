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

export type Validator<T> = {
  validate: (value: unknown) => value is T;
  ensure: (value: unknown, name?: string) => T;
  analyze: (value: unknown) => Generator<(path: string) => string>;
  isOptional: boolean;
};

export type Infer<V extends Validator<unknown> | undefined> = V extends
  Validator<infer T> ? T : never;

export class ValidationError extends Error {}

export const makeValidator = <T>(
  analyze: (value: unknown) => Generator<(path: string) => string>,
  meta?: {
    isOptional?: boolean;
  },
): Validator<T> => ({
  ensure: (value, name) => {
    for (const createErrorMessage of analyze(value)) {
      throw new ValidationError(createErrorMessage(name ?? "given value"));
    }

    return value as T;
  },
  validate: (value): value is T => {
    for (const _ of analyze(value)) {
      return false;
    }

    return true;
  },
  analyze,
  isOptional: false,
  ...meta,
});
