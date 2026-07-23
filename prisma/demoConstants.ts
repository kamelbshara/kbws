/**
 * Shared between seedDemoSchool.ts and cleanupDemoSchool.ts. Deliberately its
 * own file with zero side effects -- importing a constant out of a script
 * that calls main() at its own top level would re-run that script's main().
 */
export const DEMO_SCHOOL_NAME = "Demo Trial School";
