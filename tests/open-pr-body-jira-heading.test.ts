import { describe, expect, it } from "vitest";
import {
  buildOpenPrBodyJiraHeading,
  ensureOpenPrBodyJiraHeadingLink
} from "@/modules/prs/lib/open-pr/open-pr-body-jira-heading";

const TITLE = "JOR-198 - DT: Ajustar propriedades dos SVG dos ícones do dash";
const JIRA_URL = "https://jusfy.atlassian.net/browse/JOR-198";
const LINKED_HEADING = `# [${TITLE}](${JIRA_URL})`;

describe("open-pr-body-jira-heading", () => {
  it("monta H1 com link para o Jira quando o titulo tem chave", () => {
    expect(buildOpenPrBodyJiraHeading(TITLE)).toBe(LINKED_HEADING);
  });

  it("retorna null sem chave JOR no titulo", () => {
    expect(buildOpenPrBodyJiraHeading("Ajuste no checkout")).toBeNull();
  });

  it("converte H1 em texto plano para link do Jira", () => {
    const body = `# ${TITLE}

## Dependências

- não possui`;

    expect(ensureOpenPrBodyJiraHeadingLink(body, TITLE)).toBe(`${LINKED_HEADING}

## Dependências

- não possui`);
  });

  it("corrige placeholder jira_link do template", () => {
    const body = `# [${TITLE}](jira_link)

## Objetivo`;

    expect(ensureOpenPrBodyJiraHeadingLink(body, TITLE)).toBe(`${LINKED_HEADING}

## Objetivo`);
  });

  it("mantém H1 ja correto", () => {
    const body = `${LINKED_HEADING}

## Teste`;

    expect(ensureOpenPrBodyJiraHeadingLink(body, TITLE)).toBe(body);
  });

  it("prepende H1 quando o corpo nao comeca com titulo", () => {
    const body = "## Dependências\n\n- nada";

    expect(ensureOpenPrBodyJiraHeadingLink(body, TITLE)).toBe(`${LINKED_HEADING}

## Dependências

- nada`);
  });
});
