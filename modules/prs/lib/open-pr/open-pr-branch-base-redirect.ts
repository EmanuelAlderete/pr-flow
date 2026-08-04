export type OpenPrBranchBaseRedirectRecord = {
  branchName: string;
  baseBranch: string;
};

export type BranchMergeChecker = (
  repository: string,
  branch: string,
  intoBranch: string
) => Promise<boolean>;

export type OpenPrBranchBaseRedirectResult = {
  updatedCount: number;
  redirects: Array<{ fromBaseBranch: string; toBaseBranch: string; affectedCount: number }>;
};

export async function redirectMergedOpenPrBranchBases(input: {
  repository: string;
  defaultBranch: string;
  records: OpenPrBranchBaseRedirectRecord[];
  isBranchFullyMergedInto: BranchMergeChecker;
  updateTargets: (fromBaseBranch: string, toBaseBranch: string) => Promise<number>;
}): Promise<OpenPrBranchBaseRedirectResult> {
  const redirects: OpenPrBranchBaseRedirectResult["redirects"] = [];
  let updatedCount = 0;
  let changed = true;

  while (changed) {
    changed = false;

    const uniqueBases = [
      ...new Set(
        input.records
          .map((record) => record.baseBranch)
          .filter((baseBranch) => baseBranch !== input.defaultBranch)
      )
    ];

    for (const baseBranch of uniqueBases) {
      const mergedIntoDefault = await input.isBranchFullyMergedInto(
        input.repository,
        baseBranch,
        input.defaultBranch
      );
      if (!mergedIntoDefault) {
        continue;
      }

      const affectedCount = await input.updateTargets(baseBranch, input.defaultBranch);
      if (affectedCount === 0) {
        continue;
      }

      for (const record of input.records) {
        if (record.baseBranch === baseBranch) {
          record.baseBranch = input.defaultBranch;
        }
      }

      redirects.push({
        fromBaseBranch: baseBranch,
        toBaseBranch: input.defaultBranch,
        affectedCount
      });
      updatedCount += affectedCount;
      changed = true;
    }

    const parentByBranch = new Map(
      input.records.map((record) => [record.branchName, record.baseBranch] as const)
    );

    const usedAsBase = [
      ...new Set(
        input.records
          .map((record) => record.baseBranch)
          .filter((baseBranch) => baseBranch !== input.defaultBranch)
      )
    ];

    for (const branchName of usedAsBase) {
      const parentBranch = parentByBranch.get(branchName);
      if (!parentBranch || parentBranch === input.defaultBranch) {
        continue;
      }

      const mergedIntoParent = await input.isBranchFullyMergedInto(
        input.repository,
        branchName,
        parentBranch
      );
      if (!mergedIntoParent) {
        continue;
      }

      const affectedCount = await input.updateTargets(branchName, parentBranch);
      if (affectedCount === 0) {
        continue;
      }

      for (const record of input.records) {
        if (record.baseBranch === branchName) {
          record.baseBranch = parentBranch;
        }
      }

      redirects.push({
        fromBaseBranch: branchName,
        toBaseBranch: parentBranch,
        affectedCount
      });
      updatedCount += affectedCount;
      changed = true;
    }
  }

  return { updatedCount, redirects };
}
