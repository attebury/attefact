import { describe, expect, it } from "vitest";
import { bindingOfKind, tierOfKind, EVIDENCE_KINDS } from "./kind-taxonomy.js";

describe("tierOfKind", () => {
  it("tiers third-party-issued kinds as 1", () => {
    expect(tierOfKind("merged_pr")).toBe(1);
    expect(tierOfKind("talk_external")).toBe(1);
    expect(tierOfKind("certification")).toBe(1);
  });

  it("tiers public-but-self-published kinds as 2", () => {
    expect(tierOfKind("repo")).toBe(2);
    expect(tierOfKind("commit")).toBe(2);
    expect(tierOfKind("deploy")).toBe(2);
    expect(tierOfKind("package_release")).toBe(2);
  });

  it("tiers self-hosted upload kinds as 3, the weakest tier", () => {
    expect(tierOfKind("document")).toBe(3);
    expect(tierOfKind("screen_recording")).toBe(3);
  });
});

describe("bindingOfKind", () => {
  it("binds git-native kinds to pin", () => {
    expect(bindingOfKind("repo")).toBe("pin");
    expect(bindingOfKind("commit")).toBe("pin");
    expect(bindingOfKind("merged_pr")).toBe("pin");
  });

  it("binds fetch-a-url kinds to snapshot", () => {
    expect(bindingOfKind("deploy")).toBe("snapshot");
    expect(bindingOfKind("talk_external")).toBe("snapshot");
    expect(bindingOfKind("certification")).toBe("snapshot");
    expect(bindingOfKind("package_release")).toBe("snapshot");
  });

  it("binds directly-uploaded-file kinds to upload", () => {
    expect(bindingOfKind("document")).toBe("upload");
    expect(bindingOfKind("screen_recording")).toBe("upload");
  });
});

it("EVIDENCE_KINDS covers exactly the 9 kinds every kind/tier/binding table must agree on", () => {
  expect(EVIDENCE_KINDS).toHaveLength(9);
  for (const kind of EVIDENCE_KINDS) {
    expect(() => tierOfKind(kind)).not.toThrow();
    expect(() => bindingOfKind(kind)).not.toThrow();
  }
});
