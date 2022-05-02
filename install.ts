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

import { parse } from "https://deno.land/std@0.136.0/flags/mod.ts";
import { red } from "https://deno.land/std@0.136.0/fmt/colors.ts";

const VERSION_META_URL = "https://cdn.deno.land/strawman/meta/versions.json";

export async function checkVersion(desiredVersion: string): Promise<string> {
  console.log("Looking up latest version...");

  const { latest: latestVersion, versions: availableVersions } =
    await (await fetch(VERSION_META_URL)).json();

  if (desiredVersion === "latest") {
    desiredVersion = latestVersion;
  } else if (!availableVersions.includes(desiredVersion)) {
    desiredVersion = "v" + desiredVersion;

    if (!availableVersions.includes(desiredVersion)) {
      console.log(`${red("error")}: version(${desiredVersion}) not found!`);

      const shouldListAvailableVersions = prompt(
        "List available? [y/n (y = yes, n = no)] ",
      );

      if (
        ["y", "yes"].includes(shouldListAvailableVersions?.toLowerCase() ?? "")
      ) {
        for (const release of availableVersions) {
          console.log(release, latestVersion === release ? "(latest)" : "");
        }
      }

      Deno.exit(1);
    }
  }

  return desiredVersion;
}

export async function install(
  version: string,
): Promise<number | undefined> {
  const denoExecPath = Deno.execPath();

  const p = Deno.run({
    cmd: [
      denoExecPath,
      "install",
      "-A",
      "--unstable",
      "--no-check",
      "--location",
      "http://localhost/",
      "-n",
      "strawman",
      "-f",
      `https://deno.land/x/strawman@${version}/modules/strawman-cli/cli.ts`,
    ],
    stdout: "inherit",
    stderr: "inherit",
  });

  const status = await p.status();
  if (status.success) {
    console.log("Strawman was installed successfully");
    console.log(`Run 'strawman -h' to get started`);
  }
  return Deno.exit(status.code);
}

if (import.meta.main) {
  const { _: args, ...options } = parse(Deno.args);
  const version = await checkVersion(
    options.v || options.version || args[0] || "latest",
  );

  await install(version);
}
