use borsh::{BorshDeserialize, BorshSerialize};
use solana_sdk::program_error::ProgramError;

pub trait Serdes: Sized + BorshSerialize + BorshDeserialize {
    fn pack(&self, dst: &mut [u8]) {
        let encoded = self.try_to_vec().unwrap();
        dst[..encoded.len()].copy_from_slice(&encoded);
    }
    fn unpack(src: &[u8]) -> Result<Self, ProgramError> {
        Self::try_from_slice(src).map_err(|_| ProgramError::InvalidAccountData)
    }
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct UserProfile {
    pub name: Option<String>,
    pub bio: Option<String>,
    pub lamports_per_message: u64,
}
impl UserProfile {
    pub const SEED: &'static str = "profile";
}
impl Default for UserProfile {
    fn default() -> Self {
        Self {
            name: None,
            bio: None,
            lamports_per_message: 0,
        }
    }
}
impl Serdes for UserProfile {}
