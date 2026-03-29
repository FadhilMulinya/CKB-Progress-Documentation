#!/usr/bin/env bash

set -euo pipefail

BASE_DIR="${HOME}/fiber-node"
FIBER_REPO_DIR="${HOME}/fiber"
CKB_CLI_REPO_DIR="${HOME}/.ckb-cli-src"
NODE_DIR="${BASE_DIR}/my-fnn"
CKB_DIR="${NODE_DIR}/ckb"

CONFIG_SOURCE="config/testnet/config.yml"
BINARY_SOURCE="target/release/fnn"

print_header() {
  echo "======================================"
  echo " Fiber Node Starter"
  echo "======================================"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1"
    exit 1
  fi
}

ensure_cargo_bin_in_path() {
  export PATH="$HOME/.cargo/bin:$PATH"
}

install_ckb_cli_if_needed() {
  ensure_cargo_bin_in_path

  if command -v ckb-cli >/dev/null 2>&1; then
    echo "ckb-cli already installed."
    return
  fi

  echo "ckb-cli not found. Installing from source..."

  require_command git
  require_command cargo

  if [[ ! -d "$CKB_CLI_REPO_DIR" ]]; then
    echo "Cloning ckb-cli repository..."
    git clone https://github.com/nervosnetwork/ckb-cli.git "$CKB_CLI_REPO_DIR"
  else
    echo "ckb-cli repository already exists. Pulling latest changes..."
    cd "$CKB_CLI_REPO_DIR"
    git pull
  fi

  cd "$CKB_CLI_REPO_DIR"

  echo "Installing ckb-cli using cargo..."
  cargo install --path . -f --locked

  ensure_cargo_bin_in_path

  if ! command -v ckb-cli >/dev/null 2>&1; then
    echo "ckb-cli installation failed."
    echo "Make sure ~/.cargo/bin is in your PATH."
    exit 1
  fi

  echo "ckb-cli installed successfully."
}

check_prerequisites() {
  echo "Checking prerequisites..."

  require_command git
  require_command cargo
  require_command head
  require_command mkdir
  require_command cp

  install_ckb_cli_if_needed

  echo "All required tools are ready."
}

clone_and_build_fiber() {
  if [[ ! -d "$FIBER_REPO_DIR" ]]; then
    echo "Cloning Fiber repository..."
    git clone https://github.com/nervosnetwork/fiber.git "$FIBER_REPO_DIR"
  else
    echo "Fiber repository already exists at: $FIBER_REPO_DIR"
  fi

  cd "$FIBER_REPO_DIR"

  echo "Building fnn binary..."
  cargo build --release
}

prepare_node_directory() {
  mkdir -p "$NODE_DIR"
  mkdir -p "$CKB_DIR"

  if [[ ! -f "${FIBER_REPO_DIR}/${BINARY_SOURCE}" ]]; then
    echo "Missing built fnn binary at ${FIBER_REPO_DIR}/${BINARY_SOURCE}"
    echo "Run the build step first."
    exit 1
  fi

  if [[ ! -f "${FIBER_REPO_DIR}/${CONFIG_SOURCE}" ]]; then
    echo "Missing config file at ${FIBER_REPO_DIR}/${CONFIG_SOURCE}"
    exit 1
  fi

  cp "${FIBER_REPO_DIR}/${BINARY_SOURCE}" "${NODE_DIR}/fnn"
  cp "${FIBER_REPO_DIR}/${CONFIG_SOURCE}" "${NODE_DIR}/config.yml"
  chmod +x "${NODE_DIR}/fnn"

  echo "Node directory prepared at: $NODE_DIR"
}

create_ckb_account_instructions() {
  echo
  echo "======================================"
  echo " Step: Create a CKB account"
  echo "======================================"
  echo "If you do not already have a CKB account, run:"
  echo
  echo "  ckb-cli account new"
  echo
  echo "Example output:"
  echo "  address"
  echo "    mainnet: ckb1..."
  echo "    testnet: ckt1..."
  echo "    lock_arg: 0x..."
  echo "    lock_hash: 0x..."
  echo
  echo "You will need the lock_arg from the account you want to use."
  echo
}

export_ckb_key() {
  mkdir -p "$CKB_DIR"

  read -rp "Enter the lock_arg to export: " LOCK_ARG

  if [[ -z "${LOCK_ARG}" ]]; then
    echo "lock_arg is required."
    exit 1
  fi

  echo "Exporting key using ckb-cli..."
  ckb-cli account export \
    --lock-arg "${LOCK_ARG}" \
    --extended-privkey-path "${CKB_DIR}/exported-key"

  head -n 1 "${CKB_DIR}/exported-key" > "${CKB_DIR}/key"

  echo "Private key extracted to: ${CKB_DIR}/key"
}

start_fiber_node() {
  if [[ ! -x "${NODE_DIR}/fnn" ]]; then
    echo "fnn binary not found in ${NODE_DIR}"
    echo "Prepare the node directory first."
    exit 1
  fi

  if [[ ! -f "${NODE_DIR}/config.yml" ]]; then
    echo "config.yml not found in ${NODE_DIR}"
    echo "Prepare the node directory first."
    exit 1
  fi

  if [[ ! -f "${CKB_DIR}/key" ]]; then
    echo "CKB private key file not found at ${CKB_DIR}/key"
    echo "Export the key first."
    exit 1
  fi

  read -rsp "Enter FIBER_SECRET_KEY_PASSWORD: " FIBER_SECRET_KEY_PASSWORD
  echo

  if [[ -z "${FIBER_SECRET_KEY_PASSWORD}" ]]; then
    echo "FIBER_SECRET_KEY_PASSWORD cannot be empty."
    exit 1
  fi

  cd "$NODE_DIR"

  echo "Starting Fiber node..."
  echo "Node directory: $NODE_DIR"
  echo "Config file: ${NODE_DIR}/config.yml"
  echo

  FIBER_SECRET_KEY_PASSWORD="${FIBER_SECRET_KEY_PASSWORD}" \
  RUST_LOG=info \
  ./fnn -c config.yml -d .
}

show_menu() {
  echo
  echo "1) Check prerequisites"
  echo "2) Install ckb-cli if missing"
  echo "3) Clone + build Fiber node"
  echo "4) Prepare node directory"
  echo "5) Show CKB account creation instructions"
  echo "6) Export CKB key"
  echo "7) Start Fiber node"
  echo "8) Run full setup"
  echo "9) Exit"
  echo
}

full_setup() {
  check_prerequisites
  clone_and_build_fiber
  prepare_node_directory
  create_ckb_account_instructions
  export_ckb_key
  start_fiber_node
}

main() {
  ensure_cargo_bin_in_path
  print_header

  while true; do
    show_menu
    read -rp "Choose an option [1-9]: " choice

    case "$choice" in
      1)
        check_prerequisites
        ;;
      2)
        install_ckb_cli_if_needed
        ;;
      3)
        check_prerequisites
        clone_and_build_fiber
        ;;
      4)
        prepare_node_directory
        ;;
      5)
        create_ckb_account_instructions
        ;;
      6)
        export_ckb_key
        ;;
      7)
        start_fiber_node
        ;;
      8)
        full_setup
        ;;
      9)
        echo "Exiting."
        exit 0
        ;;
      *)
        echo "Invalid option."
        ;;
    esac
  done
}

main