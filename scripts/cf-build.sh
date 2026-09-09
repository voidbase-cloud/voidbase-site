#!/usr/bin/env bash
# Start a Cloudflare Workers Build of this repository's Worker for a branch and a commit, the way the cloudflare
# workflow does: the trigger is looked up by the Worker's name and the branch (a rename gave the Worker new triggers
# once, and a stored uuid pointed at nothing). Needs CF_ACCOUNT_ID, CLOUDFLARE_BUILDS_TOKEN; WORKER defaults to
# voidbase-site. Prints the build uuid, exports it as `uuid` when GITHUB_ENV is set.
#   scripts/cf-build.sh <branch> <commit>
set -euo pipefail
BRANCH="${1:?branch}"; COMMIT="${2:?commit}"; WORKER="${WORKER:-voidbase-site}"
API="https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID:?CF_ACCOUNT_ID}/builds"
SCRIPTS="https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/workers/scripts"
auth=(-H "Authorization: Bearer ${CLOUDFLARE_BUILDS_TOKEN:?CLOUDFLARE_BUILDS_TOKEN}" -H "Content-Type: application/json")
tag=$(curl -sS "$SCRIPTS" "${auth[@]}" | jq -r --arg w "$WORKER" '.result[]? | select(.id == $w) | .tag // empty')
[ -n "$tag" ] || { echo "no Worker called $WORKER on this account, or the token cannot read scripts"; exit 1; }
triggers=$(curl -sS "$API/workers/$tag/triggers" "${auth[@]}")
trigger=$(printf '%s' "$triggers" | jq -r --arg b "$BRANCH" '
  [.result[]? | select(((.branch_includes // []) | index($b) or index("*")) and (((.branch_excludes // []) | index($b)) == null))]
  | sort_by((.branch_includes // []) | index($b) == null) | .[0].trigger_uuid // empty')
[ -n "$trigger" ] || { echo "no build trigger of $WORKER takes branch $BRANCH; triggers: $(printf '%s' "$triggers" | jq -c '[.result[]? | {trigger_name, branch_includes, branch_excludes}]')"; exit 1; }
echo "cloudflare: trigger $trigger ($(printf '%s' "$triggers" | jq -r --arg t "$trigger" '.result[] | select(.trigger_uuid == $t) | .trigger_name')) takes $BRANCH"
body=$(printf '{"commit_hash":"%s","branch":"%s"}' "$COMMIT" "$BRANCH")
res=$(curl -sS "$API/triggers/$trigger/builds" "${auth[@]}" -d "$body")
uuid=$(printf '%s' "$res" | jq -r '.result.build_uuid // empty')
[ -n "$uuid" ] || { echo "no build started: $res"; exit 1; }
echo "cloudflare: build $uuid ($(printf '%s' "$res" | jq -r '.result.status // "queued"')) of $COMMIT on $BRANCH"
[ -n "${GITHUB_ENV:-}" ] && echo "uuid=$uuid" >> "$GITHUB_ENV" || true
