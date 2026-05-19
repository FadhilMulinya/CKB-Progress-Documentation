use std::collections::HashMap;

use ckb_hash::blake2b_256;
use ckb_jsonrpc_types as json_types;

use ckb_sdk::{
    constants::SIGHASH_TYPE_HASH,
    rpc::CkbRpcClient,
    traits::{
        DefaultCellCollector, DefaultCellDepResolver, DefaultHeaderDepResolver,
        DefaultTransactionDependencyProvider, SecpCkbRawKeySigner,
    },
    tx_builder::{transfer::CapacityTransferBuilder, CapacityBalancer, TxBuilder},
    unlock::{ScriptUnlocker, SecpSighashUnlocker},
    ScriptId, SECP256K1,
};

use ckb_types::{
    bytes::Bytes,
    core::{BlockView, DepType, ScriptHashType},
    packed::{CellDep, CellOutput, OutPoint, Script, WitnessArgs},
    prelude::*,
    H256,
};

const CKB_RPC: &str = "http://127.0.0.1:8114";

const OWNER_PRIVATE_KEY: &str =
    "6109170b275a09ad54877b82f7d9930f88cab5717d484fb4741ae9d1dd078cd6";

const SIMPLE_SUDT_CODE_HASH: &str =
    "af49063e2836e3d0f8fbb913a0532d47f0e3534e9db6232e7f7b803c0736e228";

const SIMPLE_SUDT_DEP_TX_HASH: &str =
    "6c6000d689283fd0e96f12a2618129bfe4ca5d6e882dddc741bb91f04b623e08";

const OWNER_LOCK_ARG: &str =
    "8e42b1999f265a0078503c4acec4d5e134534297";

const TOKEN_AMOUNT: u128 = 1_000_000;

// Give the token cell enough capacity.
// This is storage deposit, not token amount.
const TOKEN_CELL_CAPACITY_SHANNONS: u64 = 150_00000000;

fn parse_h256(hex_str: &str) -> H256 {
    let clean = hex_str.strip_prefix("0x").unwrap_or(hex_str);
    H256::from_slice(&hex::decode(clean).expect("invalid hex")).expect("invalid h256")
}

fn encode_u128_le(amount: u128) -> Bytes {
    Bytes::from(amount.to_le_bytes().to_vec())
}

fn build_owner_lock(sender_key: &secp256k1::SecretKey) -> Script {
    let pubkey = secp256k1::PublicKey::from_secret_key(&*SECP256K1, sender_key);
    let hash160 = blake2b_256(&pubkey.serialize()[..])[0..20].to_vec();

    Script::new_builder()
        .code_hash(SIGHASH_TYPE_HASH.pack())
        .hash_type(ScriptHashType::Type)
        .args(Bytes::from(hash160).pack())
        .build()
}

fn build_sudt_type_script() -> Script {
    let code_hash = parse_h256(SIMPLE_SUDT_CODE_HASH);

    let owner_lock_arg = hex::decode(OWNER_LOCK_ARG)
        .expect("invalid owner lock arg");

    Script::new_builder()
        .code_hash(code_hash.pack())
        .hash_type(ScriptHashType::Data2)
        .args(Bytes::from(owner_lock_arg).pack())
        .build()
}

fn build_sudt_cell_dep() -> CellDep {
    let tx_hash = parse_h256(SIMPLE_SUDT_DEP_TX_HASH);

    let out_point = OutPoint::new_builder()
        .tx_hash(tx_hash.pack())
        .index(0u32)
        .build();

    CellDep::new_builder()
        .out_point(out_point)
        .dep_type(DepType::Code)
        .build()
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let sender_key = secp256k1::SecretKey::from_slice(
        parse_h256(OWNER_PRIVATE_KEY).as_bytes(),
    )?;

    let owner_lock = build_owner_lock(&sender_key);
    let token_type = build_sudt_type_script();
    let token_data = encode_u128_le(TOKEN_AMOUNT);

    println!("Owner lock args:");
    println!("0x{}", hex::encode(owner_lock.args().raw_data()));

    println!("Token type:");
    println!("code_hash: 0x{}", hex::encode(token_type.code_hash().raw_data()));
    println!("args: 0x{}", hex::encode(token_type.args().raw_data()));

    println!("Token amount data:");
    println!("0x{}", hex::encode(token_data.clone()));

    let signer = SecpCkbRawKeySigner::new_with_secret_keys(vec![sender_key]);
    let sighash_unlocker = SecpSighashUnlocker::from(Box::new(signer) as Box<_>);

    let sighash_script_id = ScriptId::new_type(SIGHASH_TYPE_HASH.clone());

    let mut unlockers = HashMap::default();
    unlockers.insert(
        sighash_script_id,
        Box::new(sighash_unlocker) as Box<dyn ScriptUnlocker>,
    );

    let placeholder_witness = WitnessArgs::new_builder()
        .lock(Some(Bytes::from(vec![0u8; 65])).pack())
        .build();

    let balancer = CapacityBalancer::new_simple(
        owner_lock.clone(),
        placeholder_witness,
        1000,
    );

    let ckb_client = CkbRpcClient::new(CKB_RPC);

    let genesis_block = ckb_client
        .get_block_by_number(0.into())?
        .expect("genesis block not found");

    let cell_dep_resolver =
        DefaultCellDepResolver::from_genesis(&BlockView::from(genesis_block))?;

    let header_dep_resolver = DefaultHeaderDepResolver::new(CKB_RPC);
    let mut cell_collector = DefaultCellCollector::new(CKB_RPC);
    let tx_dep_provider = DefaultTransactionDependencyProvider::new(CKB_RPC, 10);

    let token_output = CellOutput::new_builder()
        .capacity(TOKEN_CELL_CAPACITY_SHANNONS)
        .lock(owner_lock.clone())
        .type_(Some(token_type).pack())
        .build();

    let builder = CapacityTransferBuilder::new(vec![
        (token_output, token_data),
    ]);

    let (tx, still_locked_groups) = builder.build_unlocked(
        &mut cell_collector,
        &cell_dep_resolver,
        &header_dep_resolver,
        &tx_dep_provider,
        &balancer,
        &unlockers,
    )?;

    if !still_locked_groups.is_empty() {
        panic!("transaction still has locked script groups");
    }

    let tx = tx
        .as_advanced_builder()
        .cell_dep(build_sudt_cell_dep())
        .build();

    let json_tx = json_types::TransactionView::from(tx);

    println!("Built tx:");
    println!("{}", serde_json::to_string_pretty(&json_tx)?);

    let outputs_validator = Some(json_types::OutputsValidator::Passthrough);

    let tx_hash = CkbRpcClient::new(CKB_RPC)
        .send_transaction(json_tx.inner, outputs_validator)?;

    println!("Mint tx sent:");
    println!("{:#x}", tx_hash);

    Ok(())
}
