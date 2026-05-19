#![no_std]
#![no_main]

use alloc::vec::Vec;


use ckb_std::{
    ckb_constants::Source,
    ckb_types::prelude::*,
    default_alloc,
    error::SysError,
    high_level::{
        load_cell_data,
        load_cell_lock,
        load_script,
    },
};

ckb_std::entry!(program_entry);
default_alloc!();

#[repr(i8)]
enum Error {
    IndexOutOfBound = 1,
    InvalidData = 2,
    Overflow = 3,
    UnauthorizedMint = 4,
    InvalidExtensionData = 5,
}

struct XudtData {
    amount: u128,
    extension_data: Vec<u8>,
}

fn read_xudt_data(source: Source, index: usize) -> Result<XudtData, Error> {
    let data = load_cell_data(index, source).map_err(|err| match err {
        SysError::IndexOutOfBound => Error::IndexOutOfBound,
        _ => Error::InvalidData,
    })?;

    if data.len() < 16 {
        return Err(Error::InvalidData);
    }

    let mut amount_bytes = [0u8; 16];
    amount_bytes.copy_from_slice(&data[0..16]);

    let amount = u128::from_le_bytes(amount_bytes);
    let extension_data = data[16..].to_vec();

    Ok(XudtData {
        amount,
        extension_data,
    })
}

fn sum_amounts(source: Source) -> Result<u128, Error> {
    let mut index = 0;
    let mut total = 0u128;

    loop {
        match read_xudt_data(source, index) {
            Ok(cell_data) => {
                total = total
                    .checked_add(cell_data.amount)
                    .ok_or(Error::Overflow)?;

                index += 1;
            }
            Err(Error::IndexOutOfBound) => break,
            Err(err) => return Err(err),
        }
    }

    Ok(total)
}

fn has_owner_input() -> Result<bool, Error> {
    let script = load_script().map_err(|_| Error::InvalidData)?;
    let args: Vec<u8> = script.args().unpack();

    if args.len() < 20 {
        return Err(Error::InvalidData);
    }

    let owner_lock_arg = &args[0..20];

    let mut index = 0;

    loop {
        match load_cell_lock(index, Source::Input) {
            Ok(lock_script) => {
                let current_args: Vec<u8> = lock_script.args().unpack();

                if current_args.as_slice() == owner_lock_arg {
                    return Ok(true);
                }

                index += 1;
            }
            Err(SysError::IndexOutOfBound) => break,
            Err(_) => return Err(Error::InvalidData),
        }
    }

    Ok(false)
}

fn validate_extension_args() -> Result<(), Error> {
    let script = load_script().map_err(|_| Error::InvalidData)?;
    let args: Vec<u8> = script.args().unpack();

    if args.len() < 20 {
        return Err(Error::InvalidData);
    }

    let extension_args = &args[20..];

    if extension_args.len() > 1024 {
        return Err(Error::InvalidExtensionData);
    }

    Ok(())
}

fn validate_extension_data() -> Result<(), Error> {
    let mut index = 0;

    loop {
        match read_xudt_data(Source::GroupOutput, index) {
            Ok(cell_data) => {
                if cell_data.extension_data.len() > 1024 {
                    return Err(Error::InvalidExtensionData);
                }

                index += 1;
            }
            Err(Error::IndexOutOfBound) => break,
            Err(err) => return Err(err),
        }
    }

    Ok(())
}

fn main() -> Result<(), Error> {
    validate_extension_args()?;
    validate_extension_data()?;

    let input_total = sum_amounts(Source::GroupInput)?;
    let output_total = sum_amounts(Source::GroupOutput)?;

    if output_total <= input_total {
        return Ok(());
    }

    if has_owner_input()? {
        return Ok(());
    }

    Err(Error::UnauthorizedMint)
}

pub fn program_entry() -> i8 {
    match main() {
        Ok(_) => 0,
        Err(err) => err as i8,
    }
}
