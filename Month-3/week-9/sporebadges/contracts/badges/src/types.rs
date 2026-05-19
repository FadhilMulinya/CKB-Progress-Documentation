use ckb_std::ckb_types::prelude::*;

#[derive(Clone, Debug)]
pub struct Badge {
    pub id: [u8; 32],
    pub issuer: [u8; 20],
    pub level: u8,
    pub transferable: bool,
}