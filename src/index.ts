import * as core from "@actions/core";
import { context } from "@actions/github";
import { createHandler } from "./handler.js";
import VError from "verror";
import { getInputs, stringInput } from "@infra-blocks/github";

async function main() {
  core.debug(`received env: ${JSON.stringify(process.env, null, 2)}`);
  core.debug(`received context: ${JSON.stringify(context, null, 2)}`);
  const inputs = getInputs({
    "template-repository": stringInput(),
    "github-token": stringInput(),
  });
  const config = {};
  core.debug(
    `creating handler with config: ${JSON.stringify(config, null, 2)}`
  );
  const handler = createHandler({
    config: {
      templateRepository: inputs["template-repository"],
      owner: inputs["template-repository"].split("/")[0],
      gitHubToken: inputs["github-token"],
    },
  });
  const outputs = await handler.handle();
  for (const [key, value] of Object.entries(outputs)) {
    core.debug(`setting output ${key}=${value}`);
    core.setOutput(key, value);
  }
}

main().catch((err: Error) => core.setFailed(VError.fullStack(err)));
