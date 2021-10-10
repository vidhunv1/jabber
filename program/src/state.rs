use crate::utils::try_from_slice_checked;
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::AccountInfo,
    clock::UnixTimestamp,
    program_error::ProgramError,
    pubkey::{Pubkey, MAX_SEED_LEN},
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

    pub fn find_from_user_key(self, user_key: &Pubkey, program_id: &Pubkey) -> Pubkey {
        let (user_profile_key, _) = Pubkey::find_program_address(
            &[Profile::SEED.as_bytes(), &user_key.to_bytes()],
            program_id,
        );
        return user_profile_key;
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
    pub const SEED: &'static str = "thread";

    pub fn find_from_users_keys(
        creator_pk: &Pubkey,
        friend_pk: &Pubkey,
        program_id: &Pubkey,
    ) -> Pubkey {
        let (thread_key, _) = Pubkey::find_program_address(
            &[
                Thread::SEED.as_bytes(),
                &creator_pk.to_bytes(),
                &friend_pk.to_bytes(),
            ],
            program_id,
        );
        return thread_key;
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
    pub const SEED: &'static str = "message";

    pub fn find_with_seed(
        index: u32,
        from_pk: &Pubkey,
        to_pk: &Pubkey,
        program_id: &Pubkey,
    ) -> Pubkey {
        let i = index.to_string();
        let end = MAX_SEED_LEN - i.len();
        let (message_key, _) = Pubkey::find_program_address(
            &[
                Message::SEED.as_bytes(),
                i.as_bytes(),
                &from_pk.to_bytes(),
                &to_pk.to_bytes(),
            ],
            program_id,
        );
        return message_key;
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
