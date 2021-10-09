use crate::utils::try_from_slice_checked;
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::AccountInfo,
    clock::UnixTimestamp,
    program_error::ProgramError,
    pubkey::{Pubkey, PubkeyError, MAX_SEED_LEN},
};

pub const MAX_NAME_LENGTH: usize = 32;
pub const MAX_BIO_LENGTH: usize = 100;
pub const MAX_MSG_LEN: usize = 1_000; // TODO change

pub const MAX_PROFILE_LEN: usize = 1 + MAX_NAME_LENGTH + MAX_BIO_LENGTH + 8 + 32;

pub const MAX_THREAD_LEN: usize = 1 + 4 + 32 + 32 + 32 + 32;

pub const MAX_MESSAGE_LEN: usize = 1 + 1 + MAX_MSG_LEN + 8;

pub const MAX_JABBER_LEN: usize = 1 + 32;

#[derive(BorshSerialize, BorshDeserialize, PartialEq, Debug, Clone, Copy)]
pub enum Tag {
    Uninitialized,
    Profile,
    Thread,
    Message,
    Jabber,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, PartialEq)]
pub struct Profile {
    pub tag: Tag,
    pub name: Option<String>,
    pub bio: Option<String>,
    pub lamports_per_message: u64,
    pub thread_tail_pk: Option<Pubkey>,
}
impl Profile {
    pub const SEED: &'static str = "profile";
    pub const MIN_SPACE: usize = 228;

    pub fn create_with_seed(user_pk: &Pubkey, program_id: &Pubkey) -> Result<Pubkey, PubkeyError> {
        Pubkey::create_with_seed(&user_pk, Profile::SEED, &program_id)
    }

    pub fn save(&self, mut dst: &mut [u8]) {
        self.serialize(&mut dst).unwrap()
    }

    pub fn from_account_info(a: &AccountInfo) -> Result<Profile, ProgramError> {
        let result: Profile =
            try_from_slice_checked(&a.data.borrow_mut(), Tag::Profile, MAX_PROFILE_LEN)?;

        Ok(result)
    }
}

impl Default for Profile {
    fn default() -> Self {
        Self {
            tag: Tag::Profile,
            name: None,
            bio: None,
            lamports_per_message: 0,
            thread_tail_pk: None,
        }
    }
}

#[derive(BorshSerialize, BorshDeserialize, Debug, PartialEq)]
pub struct Thread {
    pub tag: Tag,
    pub msg_count: u32,
    pub prev_thread_u1_pk: Option<Pubkey>,
    pub prev_thread_u2_pk: Option<Pubkey>,
    pub u1_pk: Pubkey,
    pub u2_pk: Pubkey,
}

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

    pub fn save(&self, mut dst: &mut [u8]) {
        self.serialize(&mut dst).unwrap()
    }

    pub fn from_account_info(a: &AccountInfo) -> Result<Thread, ProgramError> {
        let result: Thread =
            try_from_slice_checked(&a.data.borrow_mut(), Tag::Thread, MAX_THREAD_LEN)?;

        Ok(result)
    }
}

#[derive(BorshDeserialize, BorshSerialize, Debug, PartialEq)]
pub struct Message {
    pub tag: Tag,
    pub kind: u8,
    pub msg: Vec<u8>,
    pub timestamp: UnixTimestamp,
}

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

    pub fn save(&self, mut dst: &mut [u8]) {
        self.serialize(&mut dst).unwrap()
    }

    pub fn from_account_info(a: &AccountInfo) -> Result<Message, ProgramError> {
        let result: Message =
            try_from_slice_checked(&a.data.borrow_mut(), Tag::Message, MAX_MESSAGE_LEN)?;

        Ok(result)
    }
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct Jabber {
    pub tag: Tag,
    pub unregistered_thread_tail_pk: Option<Pubkey>,
}

impl Jabber {
    pub fn save(&self, mut dst: &mut [u8]) {
        self.serialize(&mut dst).unwrap()
    }

    pub fn from_account_info(a: &AccountInfo) -> Result<Jabber, ProgramError> {
        let result: Jabber =
            try_from_slice_checked(&a.data.borrow_mut(), Tag::Jabber, MAX_JABBER_LEN)?;

        Ok(result)
    }
}

pub mod owner_account {
    use solana_program::declare_id;
    declare_id!("D2T7LaEp7SgQCZWvxbMfWym6LW2cSfX69oXpFLCDqbVS");
}
