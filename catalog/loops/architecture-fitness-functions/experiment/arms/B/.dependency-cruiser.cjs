/**
 * The rules of ARCHITECTURE.md, as dependency-cruiser checks them: every import in src/ against the layers. Each rule's
 * comment says what the layer is for and where the code goes instead; `depcruise --output-type err-long` prints it
 * with each violation. The rules are the person's: a rule that seems wrong goes to them, it is not changed to pass.
 */
module.exports = {
  forbidden: [
    {
      name: 'report-export-do-no-io',
      severity: 'error',
      comment:
        "src/report/ and src/export/ are pure functions from invoices to a report or a CSV: no files, no network, no clock " +
        "(ARCHITECTURE.md). Do not import an I/O module here. What a report needs from outside (the contents of a file, " +
        "today's date) is read by src/cli.ts, through src/parse.ts for a file, and passed in as an argument.",
      from: { path: '^src/(report|export)/' },
      to: { dependencyTypes: ['core'], path: '^(node:)?(fs|fs/promises|path|url|http|https|net|child_process|os)$' },
    },
    {
      name: 'report-export-do-not-call-up',
      severity: 'error',
      comment:
        "src/report/ and src/export/ do not import src/cli.ts or src/parse.ts: the entry point and the module that reads " +
        "files call them, never the other way round. Take what the function needs as an argument, and let src/cli.ts " +
        "pass it in.",
      from: { path: '^src/(report|export)/' },
      to: { path: '^src/(cli|parse)\\.ts$' },
    },
    {
      name: 'only-parse-reads-files',
      severity: 'error',
      comment:
        "src/parse.ts is the only module that reads files (ARCHITECTURE.md). Read a new file in src/parse.ts, beside " +
        "readInvoices, and check its contents there; src/cli.ts calls it and passes what it read to the rest. A module " +
        "that reads a file elsewhere (in src/report/, or a new src/<name>.ts) breaks the rule even when its callers look pure.",
      from: { path: '^src/', pathNot: '^src/parse\\.ts$' },
      to: { dependencyTypes: ['core'], path: '^(node:)?fs(/promises)?$' },
    },
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'A cycle between modules: one of them belongs in another layer, or what both need goes in a module of its own.',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
  },
};
