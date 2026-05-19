use ckb_testtool::{
    context::Context,
    ckb_types::{
        bytes::Bytes,
        packed::{Script, CellInput, CellOutput},
        prelude::*,
    },
};

use std::fs;

#[test]
fn test_badge_soulbound_pass() {
    let mut context = Context::default();

    // Load compiled contract
    let binary = fs::read("../target/debug/badges").unwrap();

    let out_point = context.deploy_cell(binary.into());

    // Script args:
    // transferable = 0 (soulbound)
    // issuer_allowed = 1
    let args = Bytes::from(vec![0u8, 1u8]);

    let script = Script::new_builder()
        .args(args.pack())
        .code_hash(out_point.to_cell_output().calc_data_hash())
        .hash_type(ckb_testtool::ckb_types::core::ScriptHashType::Data.into())
        .build();

    let lock = script.clone();

    let input = CellInput::new_builder().build();
    let output = CellOutput::new_builder()
        .lock(lock)
        .build();

    context
        .transaction()
        .input(input)
        .output(output)
        .output_data(Default::default())
        .build();

    // Should pass
    let result = context.verify_tx();
    assert!(result.is_ok());
}

#[test]
fn test_badge_issuer_fail() {
    let mut context = Context::default();

    let binary = fs::read("../target/debug/badges").unwrap();
    let out_point = context.deploy_cell(binary.into());

    // issuer_allowed = 0 → should fail
    let args = Bytes::from(vec![1u8, 0u8]);

    let script = Script::new_builder()
        .args(args.pack())
        .code_hash(out_point.to_cell_output().calc_data_hash())
        .hash_type(ckb_testtool::ckb_types::core::ScriptHashType::Data.into())
        .build();

    let input = CellInput::new_builder().build();
    let output = CellOutput::new_builder()
        .lock(script.clone())
        .build();

    context
        .transaction()
        .input(input)
        .output(output)
        .output_data(Default::default())
        .build();

    let result = context.verify_tx();

    assert!(result.is_err());
}
