# Claude Code + Vibe proxy env. Source in shell, or run with CLAUDE_ENV_MODE=setup.

load_dotenv() {
  [ -f /workspace/.env ] || return 0
  set -a
  # shellcheck source=/dev/null
  . /workspace/.env
  set +a
}

map_vibe_env() {
  if [ -z "${VIBE_PROXY:-}" ] || [ -z "${VIBE_KEY:-}" ]; then
    return 0
  fi

  _vibe_proxy="${VIBE_PROXY%/}"
  _vibe_proxy="${_vibe_proxy%/v1}"

  export ANTHROPIC_BASE_URL="$_vibe_proxy"
  export ANTHROPIC_AUTH_TOKEN="$VIBE_KEY"
  export ANTHROPIC_MODEL="${ANTHROPIC_MODEL:-mimo-v2.5-pro}"
  export ANTHROPIC_SMALL_FAST_MODEL="${ANTHROPIC_SMALL_FAST_MODEL:-mimo-v2.5}"
  export CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY="${CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY:-1}"
  unset ANTHROPIC_API_KEY
}

run_setup() {
  load_dotenv
  map_vibe_env

  if [ -z "${ANTHROPIC_BASE_URL:-}" ] || [ -z "${ANTHROPIC_AUTH_TOKEN:-}" ]; then
    echo "ℹ️  VIBE_PROXY / VIBE_KEY not set in .env — skipping Claude proxy setup"
    return 0
  fi

  CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
  SETTINGS="$CLAUDE_DIR/settings.json"
  mkdir -p "$CLAUDE_DIR"

  if [ ! -w "$CLAUDE_DIR" ]; then
    sudo chown -R "$(id -u):$(id -g)" "$CLAUDE_DIR"
  fi

  rm -f "$CLAUDE_DIR/.credentials.json"

  CLAUDE_SETTINGS_PATH="$SETTINGS" node <<'NODE'
const fs = require("fs");

const settingsPath = process.env.CLAUDE_SETTINGS_PATH;
let config = {};
if (fs.existsSync(settingsPath)) {
  try {
    config = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
  } catch {
    config = {};
  }
}

config.env = {
  ...(config.env ?? {}),
  ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
  ANTHROPIC_AUTH_TOKEN: process.env.ANTHROPIC_AUTH_TOKEN,
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL ?? "mimo-v2.5-pro",
  ANTHROPIC_SMALL_FAST_MODEL: process.env.ANTHROPIC_SMALL_FAST_MODEL ?? "mimo-v2.5",
  CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY:
    process.env.CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY ?? "1",
};
delete config.env.ANTHROPIC_API_KEY;

fs.writeFileSync(settingsPath, `${JSON.stringify(config, null, 2)}\n`);
NODE

  MS="# >>> vibe-code-tours >>>"
  ME="# <<< vibe-code-tours <<<"
  HOOK='[ -f "/workspace/.devcontainer/claude-env.sh" ] && . "/workspace/.devcontainer/claude-env.sh"'

  for profile in "$HOME/.zshrc" "$HOME/.bashrc"; do
    touch "$profile"
    if grep -q "$MS" "$profile" 2>/dev/null; then
      tmp="$(mktemp)"
      sed "/$MS/,/$ME/d" "$profile" > "$tmp"
      mv "$tmp" "$profile"
    fi
    {
      echo ""
      echo "$MS"
      echo "$HOOK"
      echo "$ME"
    } >> "$profile"
  done

  echo "✅ Claude Code configured for Vibe proxy → $SETTINGS"
}

if [ "${CLAUDE_ENV_MODE:-}" = "setup" ]; then
  set -euo pipefail
  run_setup
  exit $?
fi

load_dotenv
map_vibe_env
return 0 2>/dev/null || exit 0
