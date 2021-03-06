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

import { Exception } from "../../../framework/exception.ts";

import { Template } from "../../domain/model/Template.ts";

import { fileUrlFromPath } from "./fileUrlFromPath.ts";

export type IImportTemplate = ReturnType<typeof makeImportTemplate>;

export const makeImportTemplate = (deps: {
  import: (pathToScriptFile: string) => Promise<{ default: unknown }>;
  timer: typeof Date.now;
}) => {
  const importTemplate = async (pathToTemplateFile: string) => {
    const { default: template } = await deps.import(
      `${fileUrlFromPath(pathToTemplateFile)}?now=${deps.timer()}`
    );

    if (typeof template !== "function") {
      throw Exception.raise({
        code: 1641391455,
        message: `Expected "${pathToTemplateFile}" to export a function, but got "${typeof template}" instead.`,
      });
    }

    return Template.withCallback(
      (request: Request, args: Record<string, string>) =>
        template(request, args).trim()
    );
  };

  return importTemplate;
};
