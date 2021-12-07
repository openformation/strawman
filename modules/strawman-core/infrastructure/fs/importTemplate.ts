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

import { Template } from "../../domain/model/Template.ts";

import { fileUrlFromPath } from "./fileUrlFromPath.ts";

export type RImportTemplate =
  | {
      type: "SUCCESS: Template was imported";
      value: Template;
    }
  | {
      type: "ERROR: Template was not a function";
      message: string;
    };

export type IImportTemplate = (
  pathToTemplateFile: string
) => Promise<RImportTemplate>;

export const makeImportTemplate = (deps: {
  import: (pathToScriptFile: string) => Promise<{ default: unknown }>;
  timer: typeof Date.now;
}): IImportTemplate => {
  const importTemplate: IImportTemplate = async (
    pathToTemplateFile: string
  ) => {
    const { default: template } = await deps.import(
      `${fileUrlFromPath(pathToTemplateFile)}?now=${deps.timer()}`
    );

    if (typeof template !== "function") {
      return {
        type: "ERROR: Template was not a function",
        message: `Expected "${pathToTemplateFile}" to export a function, but got "${typeof template}" instead.`,
      };
    }

    return {
      type: "SUCCESS: Template was imported",
      value: Template.withCallback((request: Request) =>
        template(request).trim()
      ),
    };
  };

  return importTemplate;
};
