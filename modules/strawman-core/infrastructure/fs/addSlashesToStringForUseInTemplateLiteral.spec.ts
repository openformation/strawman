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
 * @author Henrik Radandt <henrik.radandt@openformation.io>
 */

import { assert } from "../../../../deps-dev/asserts.ts";

import { addSlashesToStringForUseInTemplateLiteral } from "./addSlashesToStringForUseInTemplateLiteral.ts";

Deno.test({
  name:
    "`addSlashesToStringForUseInTemplateLiteral` doesn't change a string if there are no unescaped backticks or interpolation placeholders",
  fn: () => {
    assert(
      addSlashesToStringForUseInTemplateLiteral(
        "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, ... 123456789 !'§$%&/()=?",
      ) ===
        "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, ... 123456789 !'§$%&/()=?",
    );
  },
});

Deno.test({
  name:
    "`addSlashesToStringForUseInTemplateLiteral` escapes all occurences of backticks in a string by a backslash",
  fn: () => {
    assert(
      addSlashesToStringForUseInTemplateLiteral("abc`def`ghi") ===
        "abc\\`def\\`ghi",
    );
  },
});

Deno.test({
  name:
    "`addSlashesToStringForUseInTemplateLiteral` doesn't escape already backslash-escaped occurences of backticks in a string",
  fn: () => {
    assert(
      addSlashesToStringForUseInTemplateLiteral("abc\\`def`ghi") ===
        "abc\\`def\\`ghi",
    );
  },
});

Deno.test({
  name:
    "`addSlashesToStringForUseInTemplateLiteral` escapes all occurences of interpolation placeholders in a string by a backslash",
  fn: () => {
    assert(
      addSlashesToStringForUseInTemplateLiteral("abc${def}ghi") ===
        "abc\\${def}ghi",
    );
  },
});

Deno.test({
  name:
    "`addSlashesToStringForUseInTemplateLiteral` doesn't escape already backslash-escaped occurences of interpolation placeholders in a string",
  fn: () => {
    assert(
      addSlashesToStringForUseInTemplateLiteral("abc${def}\\${ghi}") ===
        "abc\\${def}\\${ghi}",
    );
  },
});
