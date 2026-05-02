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
    pub — Public function (can be called from outside)
       fn — Function definition
       program_entry — The name. Matches what we passed to entry!() above.
       -> i8 — Returns an 8-bit signed integer. 0 = success, anything else = error code.
       This is your main() function. The CKB-VM starts executing here.
*/
pub fn program_entry() -> i8 {
    ckb_std::debug!("This is a sample contract!");

    0
}