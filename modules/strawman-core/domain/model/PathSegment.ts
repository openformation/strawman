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
 */

import { createConstraints } from "../../../framework/createConstraints.ts";

const instances: Record<string, PathSegment> = {};

export const PathSegmentConstraints = createConstraints("PathSegment");

export class PathSegment {
  private constructor(
    public readonly props: {
      readonly value: string;
    },
  ) {
    PathSegmentConstraints.check({
      "must not be empty": this.props.value !== "",

      "must only contain characters safe to be used as a URI path segment (as per https://datatracker.ietf.org/doc/html/rfc3986#appendix-A)":
        /^[-_.~!$&'()*+,;=:@a-zA-Z0-9]+$/.test(this.props.value),
    });
  }

  public static readonly fromString = (pathSegmentAsString: string) => {
    const pathSegment = instances[pathSegmentAsString];
    if (pathSegment) {
      return pathSegment;
    }

    const newPathSegment = new PathSegment({ value: pathSegmentAsString });
    instances[pathSegmentAsString] = newPathSegment;

    return newPathSegment;
  };

  public readonly toString = () => this.props.value;
}
