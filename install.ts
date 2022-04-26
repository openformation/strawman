import { parse } from "https://deno.land/std@0.136.0/flags/mod.ts";
import { red } from "https://deno.land/std@0.136.0/fmt/colors.ts";

/*
 * Prompt for a response
 */
async function prompt(message = "") {
  const buf = new Uint8Array(1024);
  await Deno.stdout.write(new TextEncoder().encode(message + ": "));
  const n = <number> await Deno.stdin.read(buf);
  return new TextDecoder().decode(buf.subarray(0, n)).trim();
}

export async function checkVersion(version: string): Promise<string> {
  console.log("Looking up latest version...");

  const versionMetaUrl = "https://cdn.deno.land/strawman/meta/versions.json";
  const { latest, versions } = await (await fetch(versionMetaUrl)).json();

  if (version === "latest") {
    version = latest;
  } else if (!versions.includes(version)) {
    version = "v" + version;
    if (!versions.includes(version)) {
      console.log(`${red("error")}: version(${version}) not found!`);

      const promptForListAvailable = await prompt(
        "List available? [y/n (y = yes, n = no)] ",
      );
      if (["y", "Y", "yes", "Yes"].includes(promptForListAvailable)) {
        for (const release of versions) {
          console.log(release, latest === release ? "(latest)" : "");
        }
      }

      Deno.exit(1);
    }
  }

  return version;
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
    stdout: "null",
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
