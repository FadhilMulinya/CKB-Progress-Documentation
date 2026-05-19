use ckb_std::ckb_types::{packed::Script, prelude::*};
use blake2b_ref::Blake2bBuilder;

pub fn hash_script(script: &Script) -> [u8; 32] {
    let mut hasher = Blake2bBuilder::new(32)
        .personal(b"ckb-default-hash")
        .build();

    hasher.update(script.as_slice());

    let mut out = [0u8; 32];
    hasher.finalize(&mut out);
    out
}