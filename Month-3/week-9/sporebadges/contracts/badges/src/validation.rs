use ckb_std::{
    ckb_constants::Source,
    high_level,
    error::SysError,
};

pub fn validate_badge_tx() -> Result<(), SysError> {
    let _script = high_level::load_script()?;

    // Count INPUT CELLS (manual iteration)
    let mut input_count = 0;
    loop {
        match high_level::load_cell_lock(input_count, Source::Input) {
            Ok(_) => input_count += 1,
            Err(SysError::IndexOutOfBound) => break,
            Err(e) => return Err(e),
        }
    }

    // Count OUTPUT CELLS
    let mut output_count = 0;
    loop {
        match high_level::load_cell_lock(output_count, Source::Output) {
            Ok(_) => output_count += 1,
            Err(SysError::IndexOutOfBound) => break,
            Err(e) => return Err(e),
        }
    }

    if input_count == 0 || output_count == 0 {
        return Err(SysError::IndexOutOfBound);
    }

    Ok(())
}