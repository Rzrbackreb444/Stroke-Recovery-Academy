#!/bin/bash
set -e

# Post-merge reconciliation.
#
# NOTE: we deliberately do NOT use `drizzle-kit push` here. This repo's database
# contains external, drizzle-unmanaged schemas (`stripe`, `author_brain`), which
# make `push` prompt interactively (promptNamedWithSchemasConflict). Post-merge
# runs with stdin closed, so any interactive prompt hangs until it is killed.
#
# Instead we apply committed SQL migrations non-interactively with `drizzle-kit
# migrate`. The migration journal (drizzle.__drizzle_migrations) has been
# baselined to 0000/0001, so an already-synced database is a clean no-op and
# only genuinely new, committed migration files get applied.

npm install
npx drizzle-kit migrate
