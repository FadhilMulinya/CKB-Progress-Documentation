#![no_std]
#![cfg_attr(not(test), no_main)]

#[cfg(any(feature = "std", test))]
extern crate std;

ckb_std::entry!(program_entry);


ckb_std::default_alloc!(16384, 1258306, 64);

mod validation;
mod issuer;
mod types;
mod panic;

use validation::validate_badge_tx;

pub fn program_entry() -> i8 {
    match validate_badge_tx() {
        Ok(_) => 0,
        Err(_) => 1,
    }
}