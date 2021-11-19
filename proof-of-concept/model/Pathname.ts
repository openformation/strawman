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

import { assert } from "https://deno.land/std/testing/asserts.ts";

const pathnameInstances = new Map<string, Pathname>();

export class Pathname {
  private constructor(
    public readonly props: {
      readonly value: string;
    }
  ) {
    assert(props.value.startsWith("/"), "`Pathname` must start with a '/'");
    assert(
      props.value === "/" || !props.value.endsWith("/"),
      "`Pathname` must not end with a '/'"
    );

    this.isRoot = this.props.value === "/";
  }

  public readonly isRoot: boolean;

  public static readonly fromString = (string: string) => {
    const pathname = pathnameInstances.get(string);
    if (pathname) {
      return pathname;
    }

    const newPathname = new Pathname({ value: string });
    pathnameInstances.set(string, newPathname);

    return newPathname;
  };

  public readonly isAncestorOf = (other: Pathname) =>
    other.props.value.startsWith(this.props.value);

  public readonly isParentOf = (other: Pathname) =>
    this.isAncestorOf(other) &&
    !other.props.value.substr(this.props.value.length + 1).includes("/");

  public readonly parent = () => {
    if (this.props.value === "/") {
      return null;
    }

    const [, ...segments] = this.props.value.split("/");
    segments.pop();

    return Pathname.fromString(`/${segments.join("/")}`);
  };

  public readonly append = (segment: string) => {
    assert(!segment.includes("/"), "segment must not contain '/'");
    return this.props.value === "/"
      ? Pathname.fromString(`/${segment}`)
      : Pathname.fromString(`${this.props.value}/${segment}`);
  };

  public readonly basename = () => {
    if (this.props.value === "/") {
      return null;
    }

    const [, ...segments] = this.props.value.split("/");
    return segments.pop()!;
  };
}
