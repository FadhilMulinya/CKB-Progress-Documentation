/*
    #![...] — This is an inner attribute in Rust. It applies to the entire file/module.
    (If it was just #, it would apply to the next item only)

    cfg_attr(condition, attribute) — A conditional compilation directive.
    It means: "If condition is true, then apply attribute to this file."

            not(any(feature = "library", test)) — The condition:

                    feature = "library" — true if we're building as a library (not a binary)

                    test — true if we're running cargo test

                any(...) — true if ANY of these are true

            not(...) — inverts it: true if we are NOT building as library AND NOT testing

        no_std — The attribute to apply. It means "don't use Rust's standard library"

    In plain English:
    "If we're NOT building as a library and NOT running tests, then use no_std."
    Why? When deployed on CKB-VM, there's no OS, no filesystem, no heap by default. 
    But when running tests on your local machine, you DO have those things.
*/
#![cfg_attr(not(any(feature = "library", test)), no_std)]

/*
    not(test) — If we're NOT running tests

    no_main — Don't use Rust's default main function signature

    In plain English:
    "If we're NOT testing, don't expect a normal fn main() with command-line arguments."
    We use CKB's entry! macro instead, which creates a custom entry point.
*/
#![cfg_attr(not(test), no_main)]

/*
    #[...] — Outer attribute (only applies to the next item)

    cfg(any(feature = "library", test)) — If we're building as a library OR testing

    extern crate alloc; — Import the alloc crate

    What is alloc?
    Rust's standard library is split into layers:

    core — Available everywhere, no allocation needed

    alloc — Provides heap allocation (Box, Vec, String). Needs a memory allocator.

    std — Full standard library. Needs an operating system.

    When testing locally, we want Vec, String, etc. So we import alloc.
    When running on CKB-VM, we use ckb_std::default_alloc! instead (next line).
*/
#[cfg(any(feature = "library", test))]
extern crate alloc;

/*
    entry! tells CKB-VM: "start execution at program_entry function"
    
       #[cfg(not(any(feature = "library", test)))] — Only when NOT library AND NOT testing
       ckb_std::entry!(program_entry) — A macro that sets program_entry as the VM entry point

    Very important — This tells CKB that program_entry() is the entry point (like main())
*/
#[cfg(not(any(feature = "library", test)))]
ckb_std::entry!(program_entry);

/*
    Only when deployed on CKB-VM (not library, not test)

    default_alloc!(16384, 1258306, 64) — Sets up a memory allocator

    Parameters:

    16384 — Fixed heap size: 16 KB. Always available, zero overhead.

    1258306 — Dynamic heap size: ~1.2 MB. Grows as needed.

    64 — Minimum block size in dynamic heap: 64 bytes. Smaller allocations waste less memory.

    Why these numbers?
    CKB cells have limited capacity. Your code + memory usage must fit within the cell's capacity.
    This configuration says: "I need ~1.2 MB for heap allocations."

    Plain English: "Give me a memory allocator so I can use Vec, String, format!, etc."
*/
#[cfg(not(any(feature = "library", test)))]
ckb_std::default_alloc!(16384, 1258306, 64);

/*
    These imports bring in the CKB tools we need to read blockchain data.

    ckb_constants::Source tells us where to look for cells. It's like an address book for inputs, outputs, and headers.

    ckb_types::prelude gives us helper functions. We use .unpack() to decode numbers and .raw_data() to get raw bytes.

    load_cell_data reads the data field of a cell. We'll use this to get the gift card message stored on chain.

    load_script reads the current script's configuration. We use this to get the claim block number from the script arguments.

    load_header reads block information. We need this to get the current block number and check if enough time has passed.

    TryInto lets us safely convert between types. We'll use it to turn raw bytes into fixed-size arrays like [u8; 8].
*/
use ckb_std::{
    ckb_constants::Source,
    ckb_types::prelude::*,
    high_level::{load_cell_data, load_script, load_header},
};
use core::convert::TryInto;

/*
    pub — Public function (can be called from outside)
       fn — Function definition
       program_entry — The name. Matches what we passed to entry!() above.
       -> i8 — Returns an 8-bit signed integer. 0 = success, anything else = error code.
       This is your main() function. The CKB-VM starts executing here.
*/

const ERROR_TOO_EARLY: i8 = 1;
const ERROR_MESSAGE_CHANGED: i8 = 2;
const ERROR_NO_DATA: i8 = 3;

 pub fn program_entry() -> i8 {
 let script = load_script().expect("Failed to load script");
 let args = script.args();
 let exact = 8
    //args should be exactly 8 bytes ( a u64 block number)
    if args.len() < exact {
      return ERROR_NO_DATA;
    }

    //Convert first 8 bytes to a u64 number (little endian)
    let claim_block:u64 = {
         let bytes: [u8; 8] = args[0..8].try_into().unwrap();
         u64::from_le_bytes(bytes)
    };

 //Get the current block number
  let header = load_header(0, Source::HeaderDep).expect("Failed to load header. Did you add heade_deps to the transaction?");

  let current_block=header.raw().number().unpack();

  //STEP 3: THE GIFT CARD RULE 
 //" Has claim block been reached?"
   if current_block < claim_block { 
       return ERROR_TOO_EARLY;
  }
 //NOTE: If we get here block was reached , Continue..

 
    //STEP 4: Read the gift card message
    let input_data = load_cell_data
}
