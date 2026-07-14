#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/resolve-db-url.sh
source "$SCRIPT_DIR/resolve-db-url.sh"

echo ""
echo "Starting Drizzle Studio..."
echo ""
echo "Drizzle Studio UI: https://local.drizzle.studio"
echo ""
echo "In a devcontainer, that page must reach port 4983 on your Mac:"
echo "  1. Keep this command running"
echo "  2. Open the Ports tab in Cursor"
echo "  3. Forward port 4983 if it is not listed yet"
echo "  4. Open https://local.drizzle.studio in your Mac browser"
echo ""
echo "If the page loads but cannot connect, allow local network access in the browser."
echo ""

if ss -tln 2>/dev/null | grep -q ':4983 '; then
  echo "Port 4983 is already in use. Stop the other Drizzle Studio process first:"
  echo "  pkill -f 'drizzle-kit studio'  or press Ctrl+C in that terminal"
  exit 1
fi

exec "$SCRIPT_DIR/../../../node_modules/.bin/drizzle-kit" studio --host 127.0.0.1 --port 4983
