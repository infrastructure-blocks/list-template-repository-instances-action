import { GitHubClient } from "@infra-blocks/github";
import VError from "verror";

// TODO: move into lib?
export type Outputs = Record<string, string>;

export interface Handler<O extends Outputs = Outputs> {
  handle(): Promise<O>;
}

export interface Config {
  /**
   * The GitHub organization to query.
   */
  owner: string;
  /**
   * The template repository's full name (owner/repo)
   */
  templateRepository: string;
  /**
   * The GitHub token to make authenticated calls to the API.
   */
  gitHubToken: string;
}

export interface ListTemplateRepositoryInstancesOutputs extends Outputs {
  ["instances"]: string;
}

export class ListTemplateRepositoryInstancesHandler
  implements Handler<ListTemplateRepositoryInstancesOutputs>
{
  private static ERROR_NAME = "ListTemplateRepositoryInstancesHandlerError";

  private readonly config: Config;
  private readonly github: GitHubClient;

  constructor(params: { config: Config; github: GitHubClient }) {
    const { config, github } = params;
    this.config = config;
    this.github = github;
  }

  async handle(): Promise<ListTemplateRepositoryInstancesOutputs> {
    const instances = await this.findTemplateRepositoryInstances();
    return {
      instances: JSON.stringify(instances),
    };
  }

  private async findTemplateRepositoryInstances() {
    const owner = this.config.owner;
    const repos = await this.listOwnerRepos();

    const templateInstances = [];
    // Get them one by one to see if they have the same template repository.
    for (const repo of repos) {
      const fullRepo = await this.github.getRepository({
        owner,
        repository: repo.name,
      });
      if (
        fullRepo.template_repository?.full_name ===
        this.config.templateRepository
      ) {
        templateInstances.push(fullRepo);
      }
    }
    return templateInstances;
  }

  private async listOwnerRepos() {
    // First, we need to figure out if the owner is a user or an org, as they don't have the same
    // endpoints to list their repos.
    const owner = this.config.owner;
    const ownerInfo = await this.github.getUser({ user: owner });

    switch (ownerInfo.type) {
      case "User":
        return this.github.listUserRepositories({ user: owner });
      case "Organization":
        return this.github.listOrganizationRepositories({
          organization: owner,
        });
      default:
        throw new VError(
          { name: ListTemplateRepositoryInstancesHandler.ERROR_NAME },
          `unknown owner type: ${ownerInfo.type} for owner: ${owner}`
        );
    }
  }
}

export function createHandler(params: { config: Config }): Handler {
  const { config } = params;
  const github = GitHubClient.create({ gitHubToken: config.gitHubToken });

  return new ListTemplateRepositoryInstancesHandler({ github, config });
}
