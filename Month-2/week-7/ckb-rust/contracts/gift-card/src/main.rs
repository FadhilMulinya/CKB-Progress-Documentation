//  The #! means "this applies to the whole file
//cfg_attr means "conditionally apply an attribute"
#![cfg_attr(not(any(feature = "library", test)), no_std)] //Tells Rust: "Don't use standard library when running on CKB"
#![cfg_attr(not(test), no_main)] //Removes the normal main() requirement when not testing

// The # without "!" means only apply to the next line
#[cfg(any(feature = "library", test))]
extern crate alloc;     //Brings in memory allocation (Vec, String, etc.) only for tests/library

#[cfg(not(any(feature = "library", test)))]
ckb_std::entry!(program_entry); //Very important — This tells CKB that program_entry() is the entry point (like main())
#[cfg(not(any(feature = "library", test)))]

ckb_std::default_alloc!(16384, 1258306, 64); //Sets up memory(heap0 so you can use `Vec, String`,etc
//inside the contract

//This is the actual contract logic. CKB calls this function. Must return 0 for success.
pub fn program_entry() -> i8 {
    ckb_std::debug!("This is a sample contract!");

    0
}
