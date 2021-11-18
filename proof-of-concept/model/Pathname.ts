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

const pathnameInstances = new Map<string, Pathname>();

export class Pathname {
  private constructor(
    public readonly props: {
      readonly value: string;
    }
  ) {}

  public static readonly fromString = (string: string) => {
    const pathname = pathnameInstances.get(string);
    if (pathname) {
      return pathname;
    }

    const newPathname = new Pathname({ value: string });
    pathnameInstances.set(string, newPathname);

    return newPathname;
  };
}
