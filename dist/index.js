// docs: schema is dialect-split -- import "@attebury/attefact/schema/pg"
// or "@attebury/attefact/schema/sqlite" explicitly, never from here.
// The bare package entrypoint only re-exports the dialect-agnostic
// pure-logic layer.
export * from "./logic/index.js";
