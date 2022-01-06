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

export class Exception<Meta = undefined> extends Error {
  private constructor(
    private readonly props: {
      code: number;
      message: string;
      meta?: Meta;
      cause?: Error;
    },
  ) {
    super(`#${props.code}: ${props.message}`, {
      cause: props.cause,
    });
  }

  public static raise = <
    Meta = undefined,
  >(props: {
    code: number;
    message: string;
    meta?: Meta;
    cause?: Error;
  }) => new Exception<Meta>(props);

  public get code() {
    return this.props.code;
  }

  public get message() {
    return this.props.message;
  }

  public get meta() {
    return this.props.meta;
  }

  public get cause() {
    return this.props.cause;
  }
}
