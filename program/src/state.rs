use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    clock::UnixTimestamp,
    program_error::ProgramError,
    pubkey::{Pubkey, PubkeyError, MAX_SEED_LEN},
    program_pack::{IsInitialized, Pack, Sealed},
};

pub type PublicKey = [u8; 32];
pub trait Serdes: Sized + BorshSerialize + BorshDeserialize {
    fn pack(&self, dst: &mut [u8]) {
        let encoded = self.try_to_vec().unwrap();
        dst[..encoded.len()].copy_from_slice(&encoded);
    }
    fn unpack(src: &[u8]) -> Result<Self, ProgramError> {
        Self::try_from_slice(src).map_err(|_| ProgramError::InvalidAccountData)
    }
}

#[derive(BorshSerialize, BorshDeserialize, Debug, PartialEq)]
pub struct Profile {
    pub name: Option<String>,
    pub bio: Option<String>,
    pub lamports_per_message: u64,
    pub thread_tail_pk: Option<PublicKey>,
}
impl Profile {
    pub const SEED: &'static str = "profile";
    pub const MIN_SPACE: usize = 228;

    pub fn create_with_seed(user_pk: &Pubkey, program_id: &Pubkey) -> Result<Pubkey, PubkeyError> {
        Pubkey::create_with_seed(&user_pk, Profile::SEED, &program_id)
    }
}
impl Default for Profile {
    fn default() -> Self {
        Self {
            name: None,
            bio: None,
            lamports_per_message: 0,
            thread_tail_pk: None,
        }
    }
}
impl Serdes for Profile {}

#[derive(BorshSerialize, BorshDeserialize, Debug, PartialEq)]
pub struct Thread {
    pub msg_count: u32,
    pub prev_thread_u1_pk: Option<PublicKey>,
    pub prev_thread_u2_pk: Option<PublicKey>,
    pub u1_pk: PublicKey,
    pub u2_pk: PublicKey,
}
impl Serdes for Thread {}
impl Thread {
    pub const MIN_SPACE: usize = 134;
    pub fn create_with_seed(
        creator_pk: &Pubkey,
        friend_pk: &Pubkey,
        program_id: &Pubkey,
    ) -> Result<Pubkey, PubkeyError> {
        Pubkey::create_with_seed(
            creator_pk,
            &friend_pk.to_string()[..MAX_SEED_LEN],
            program_id,
        )
    }
}

#[derive(BorshDeserialize, BorshSerialize, Debug, PartialEq)]
pub struct Message {
    pub kind: u8,
    pub msg: Vec<u8>,
    pub timestamp: UnixTimestamp,
}

impl Sealed for Message {}

impl Message {
    pub fn create_with_seed(
        index: u32,
        from_pk: &Pubkey,
        to_pk: &Pubkey,
        program_id: &Pubkey,
    ) -> Result<Pubkey, PubkeyError> {
        let i = index.to_string();
        let end = MAX_SEED_LEN - i.len();
        Pubkey::create_with_seed(
            from_pk,
            &[i, to_pk.to_string()[..end].to_string()].concat(),
            program_id,
        )
    }
}
impl Serdes for Message {}
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct Jabber {
    pub unregistered_thread_tail_pk: Option<PublicKey>,
}
impl Serdes for Jabber {}
impl Jabber {
    pub fn get_account(program_id: &Pubkey) -> Result<Pubkey, PubkeyError> {
        Pubkey::create_with_seed(&owner_account::id(), "jabber", program_id)
    }
}
pub mod owner_account {
    use solana_program::declare_id;
    declare_id!("D2T7LaEp7SgQCZWvxbMfWym6LW2cSfX69oXpFLCDqbVS");
}
