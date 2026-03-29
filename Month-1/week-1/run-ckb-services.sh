#!/usr/bin/env bash

set -euo pipefail

BASE_DIR="${HOME}/ckb-local"
LIGHT_CLIENT_REPO="${BASE_DIR}/ckb-light-client"
LIGHT_CLIENT_WORKDIR="${BASE_DIR}/light-client"
LOG_DIR="${BASE_DIR}/logs"
PID_DIR="${BASE_DIR}/pids"
ENV_FILE="${BASE_DIR}/.env"

CKB_CONFIG_FILE="${LIGHT_CLIENT_WORKDIR}/mainnet.toml"
LIGHT_CLIENT_BIN="${LIGHT_CLIENT_WORKDIR}/ckb-light-client"

mkdir -p "$BASE_DIR" "$LOG_DIR" "$PID_DIR"

DEVNET_LOG="${LOG_DIR}/devnet.log"
LIGHTCLIENT_LOG="${LOG_DIR}/lightclient.log"

DEVNET_PID_FILE="${PID_DIR}/devnet.pid"
LIGHTCLIENT_PID_FILE="${PID_DIR}/lightclient.pid"

print_menu() {
  echo "======================================"
  echo " CKB Local Node Manager"
  echo "======================================"
  echo "1) Start CKB devnet"
  echo "2) Setup + start CKB light client"
  echo "3) Start both"
  echo "4) Stop devnet"
  echo "5) Stop light client"
  echo "6) Stop both"
  echo "7) Show status"
  echo "8) Exit"
  echo "======================================"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1"
    exit 1
  fi
}

install_offckb_if_needed() {
  if ! command -v offckb >/dev/null 2>&1; then
    echo "Installing @offckb/cli globally..."
    npm install -g @offckb/cli
  fi
}

write_env_var() {
  local key="$1"
  local value="$2"

  touch "$ENV_FILE"

  if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    echo "${key}=${value}" >> "$ENV_FILE"
  fi
}

extract_devnet_rpc_url() {
  local rpc_url=""
  local attempts=20

  for ((i=1; i<=attempts; i++)); do
    if grep -q "CKB devnet RPC Proxy server running on" "$DEVNET_LOG" 2>/dev/null; then
      rpc_url="$(grep "CKB devnet RPC Proxy server running on" "$DEVNET_LOG" | tail -1 | awk '{print $NF}')"
      echo "$rpc_url"
      return 0
    fi
    sleep 1
  done

  return 1
}

extract_lightclient_rpc_url() {
  local rpc_url=""
  local attempts=15

  for ((i=1; i<=attempts; i++)); do
    if grep -Eq "127\.0\.0\.1:9000|localhost:9000|listen.*9000|rpc.*9000" "$LIGHTCLIENT_LOG" 2>/dev/null; then
      rpc_url="http://127.0.0.1:9000"
      echo "$rpc_url"
      return 0
    fi
    sleep 1
  done

  echo "http://127.0.0.1:9000"
  return 0
}

check_devnet_start_failure() {
  if grep -q "AddrInUse" "$DEVNET_LOG" 2>/dev/null || grep -q "Address already in use" "$DEVNET_LOG" 2>/dev/null; then
    echo "Devnet failed to start because a required port is already in use."
    echo "Check log: $DEVNET_LOG"
    echo "You likely have another CKB/offckb process already running."
    return 1
  fi
  return 0
}

kill_process_tree() {
  local pid="$1"

  if kill -0 "$pid" 2>/dev/null; then
    pkill -TERM -P "$pid" 2>/dev/null || true
    sleep 1
    kill -TERM "$pid" 2>/dev/null || true
    sleep 2
    pkill -KILL -P "$pid" 2>/dev/null || true
    kill -KILL "$pid" 2>/dev/null || true
  fi
}

cleanup_devnet_ports() {
  local ports=(8114 8115 28114)

  for port in "${ports[@]}"; do
    if command -v fuser >/dev/null 2>&1; then
      fuser -k "${port}/tcp" 2>/dev/null || true
    fi
  done
}

start_devnet() {
  install_offckb_if_needed

  if [[ -f "$DEVNET_PID_FILE" ]] && kill -0 "$(cat "$DEVNET_PID_FILE")" 2>/dev/null; then
    echo "Devnet is already running with PID $(cat "$DEVNET_PID_FILE")"

    if rpc_url="$(extract_devnet_rpc_url)"; then
      echo "CKB devnet RPC Proxy server running on ${rpc_url}"
      write_env_var "CKB_DEVNET_RPC_URL" "$rpc_url"
      echo "Saved to $ENV_FILE"
    fi

    return
  fi

  : > "$DEVNET_LOG"

  echo "Starting CKB devnet in background..."
  nohup offckb node >"$DEVNET_LOG" 2>&1 &
  echo $! > "$DEVNET_PID_FILE"

  sleep 3

  if ! kill -0 "$(cat "$DEVNET_PID_FILE")" 2>/dev/null; then
    echo "Devnet process died immediately."
    echo "Check log: $DEVNET_LOG"
    return 1
  fi

  if ! check_devnet_start_failure; then
    stop_devnet >/dev/null 2>&1 || true
    return 1
  fi

  echo "Devnet started. PID: $(cat "$DEVNET_PID_FILE")"
  echo "Log: $DEVNET_LOG"

  if rpc_url="$(extract_devnet_rpc_url)"; then
    echo "CKB devnet RPC Proxy server running on ${rpc_url}"
    write_env_var "CKB_DEVNET_RPC_URL" "$rpc_url"
    echo "Saved CKB_DEVNET_RPC_URL to $ENV_FILE"
  else
    echo "Could not detect devnet RPC URL yet."
    echo "Check log manually: $DEVNET_LOG"
  fi
}

setup_light_client() {
  require_command git
  require_command cargo
  require_command cp

  if [[ ! -d "$LIGHT_CLIENT_REPO" ]]; then
    echo "Cloning ckb-light-client repo..."
    git clone https://github.com/nervosnetwork/ckb-light-client.git "$LIGHT_CLIENT_REPO"
  fi

  cd "$LIGHT_CLIENT_REPO"

  echo "Building ckb-light-client..."
  cargo build --release

  mkdir -p "$LIGHT_CLIENT_WORKDIR"

  cp target/release/ckb-light-client "$LIGHT_CLIENT_BIN"
  cp config/mainnet.toml "$CKB_CONFIG_FILE"

  chmod +x "$LIGHT_CLIENT_BIN"

  echo "Light client binary and config copied to:"
  echo "  $LIGHT_CLIENT_WORKDIR"
  echo
  echo "Important:"
  echo "- This uses mainnet.toml by default."
  echo "- If you want the light client to connect to your own full node,"
  echo "  edit the bootnodes section in the config to point to that node."
}

start_light_client() {
  if [[ ! -x "$LIGHT_CLIENT_BIN" ]] || [[ ! -f "$CKB_CONFIG_FILE" ]]; then
    echo "Light client is not set up yet. Setting it up first..."
    setup_light_client
  fi

  if [[ -f "$LIGHTCLIENT_PID_FILE" ]] && kill -0 "$(cat "$LIGHTCLIENT_PID_FILE")" 2>/dev/null; then
    echo "Light client is already running with PID $(cat "$LIGHTCLIENT_PID_FILE")"
    rpc_url="$(extract_lightclient_rpc_url)"
    echo "CKB light client RPC running on ${rpc_url}"
    write_env_var "CKB_LIGHT_CLIENT_RPC_URL" "$rpc_url"
    echo "Saved to $ENV_FILE"
    return
  fi

  : > "$LIGHTCLIENT_LOG"

  echo "Starting light client in background..."
  cd "$LIGHT_CLIENT_WORKDIR"
  nohup env RUST_LOG=info,ckb_light_client=info \
    "$LIGHT_CLIENT_BIN" run --config-file "$CKB_CONFIG_FILE" \
    >"$LIGHTCLIENT_LOG" 2>&1 &
  echo $! > "$LIGHTCLIENT_PID_FILE"

  sleep 3

  if ! kill -0 "$(cat "$LIGHTCLIENT_PID_FILE")" 2>/dev/null; then
    echo "Light client process died immediately."
    echo "Check log: $LIGHTCLIENT_LOG"
    return 1
  fi

  echo "Light client started. PID: $(cat "$LIGHTCLIENT_PID_FILE")"
  echo "Log: $LIGHTCLIENT_LOG"

  rpc_url="$(extract_lightclient_rpc_url)"
  echo "CKB light client RPC running on ${rpc_url}"
  write_env_var "CKB_LIGHT_CLIENT_RPC_URL" "$rpc_url"
  echo "Saved CKB_LIGHT_CLIENT_RPC_URL to $ENV_FILE"
}

stop_process() {
  local pid_file="$1"
  local name="$2"

  if [[ -f "$pid_file" ]]; then
    local pid
    pid="$(cat "$pid_file")"

    if kill -0 "$pid" 2>/dev/null; then
      echo "Stopping $name (PID $pid)..."
      kill_process_tree "$pid"
      echo "$name stopped."
    else
      echo "$name PID file existed, but process was not running."
    fi

    rm -f "$pid_file"
  else
    echo "$name is not running."
  fi
}

stop_devnet() {
  stop_process "$DEVNET_PID_FILE" "Devnet"

  pkill -f offckb 2>/dev/null || true
  pkill -f "ckb run" 2>/dev/null || true
  pkill -f ckb 2>/dev/null || true

  cleanup_devnet_ports

  echo "Devnet ports cleaned up."
}

stop_light_client() {
  stop_process "$LIGHTCLIENT_PID_FILE" "Light client"
  pkill -f ckb-light-client 2>/dev/null || true
}

show_status() {
  echo "Status:"

  if [[ -f "$DEVNET_PID_FILE" ]] && kill -0 "$(cat "$DEVNET_PID_FILE")" 2>/dev/null; then
    echo "  Devnet: RUNNING (PID $(cat "$DEVNET_PID_FILE"))"
    if rpc_url="$(extract_devnet_rpc_url)"; then
      echo "  Devnet RPC: $rpc_url"
    else
      echo "  Devnet RPC: not detected yet"
    fi
  else
    echo "  Devnet: STOPPED"
  fi

  if [[ -f "$LIGHTCLIENT_PID_FILE" ]] && kill -0 "$(cat "$LIGHTCLIENT_PID_FILE")" 2>/dev/null; then
    echo "  Light client: RUNNING (PID $(cat "$LIGHTCLIENT_PID_FILE"))"
    rpc_url="$(extract_lightclient_rpc_url)"
    echo "  Light client RPC: $rpc_url"
  else
    echo "  Light client: STOPPED"
  fi

  if [[ -f "$ENV_FILE" ]]; then
    echo "  Env file: $ENV_FILE"
  fi
}

while true; do
  print_menu
  read -rp "Choose an option [1-8]: " choice

  case "$choice" in
    1)
      start_devnet
      ;;
    2)
      start_light_client
      ;;
    3)
      start_devnet
      start_light_client
      ;;
    4)
      stop_devnet
      ;;
    5)
      stop_light_client
      ;;
    6)
      stop_devnet
      stop_light_client
      ;;
    7)
      show_status
      ;;
    8)
      echo "Exiting."
      exit 0
      ;;
    *)
      echo "Invalid option."
      ;;
  esac

  echo
done