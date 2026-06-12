import { describe, expect, it } from "vitest";
import { adfToPlainText, extractFigmaUrls, normalizePlainText } from "@/modules/jira/lib/jira-adf";

describe("jira-adf", () => {
  it("converte ADF em texto simples", () => {
    const adf = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Figma: ", marks: [{ type: "strong" }] },
            {
              type: "text",
              text: "https://www.figma.com/design/abc",
              marks: [{ type: "link", attrs: { href: "https://www.figma.com/design/abc" } }]
            }
          ]
        }
      ]
    };

    expect(normalizePlainText(adfToPlainText(adf))).toBe("Figma: https://www.figma.com/design/abc");
  });

  it("extrai links do Figma do ADF", () => {
    const adf = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "layout",
              marks: [{ type: "link", attrs: { href: "https://www.figma.com/file/xyz" } }]
            }
          ]
        }
      ]
    };

    expect(extractFigmaUrls(adf)).toEqual(["https://www.figma.com/file/xyz"]);
  });
});
