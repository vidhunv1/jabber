use crate::utils::{order_keys, try_from_slice_checked};
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::AccountInfo,
    clock::Clock,
    clock::UnixTimestamp,
    program_error::ProgramError,
    pubkey::{Pubkey, MAX_SEED_LEN},
};

pub const MAX_NAME_LENGTH: usize = 32;
pub const MAX_BIO_LENGTH: usize = 100;
pub const MAX_MSG_LEN: usize = 1_000; // TODO change

pub const MAX_PROFILE_LEN: usize = 1 + MAX_NAME_LENGTH + MAX_BIO_LENGTH + 8 + 1;

pub const MAX_THREAD_LEN: usize = 1 + 4 + 32 + 32 + 1;

pub const MAX_MESSAGE_LEN: usize = 1 + 1 + 8 + MAX_MSG_LEN;

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
    pub name: String,
    pub bio: String,
    pub lamports_per_message: u64,
    pub bump: u8,
}
impl Profile {
    pub const SEED: &'static str = "profile";

    pub fn find_from_user_key(user_key: &Pubkey, program_id: &Pubkey) -> (Pubkey, u8) {
        let (user_profile_key, bump) = Pubkey::find_program_address(
            &[Profile::SEED.as_bytes(), &user_key.to_bytes()],
            program_id,
        );
        return (user_profile_key, bump);
    }

    pub fn create_from_keys(user_key: &Pubkey, program_id: &Pubkey, bump: u8) -> Pubkey {
        let seeds = &[Profile::SEED.as_bytes(), &user_key.to_bytes(), &[bump]];
        Pubkey::create_program_address(seeds, program_id).unwrap()
    }

    pub fn new(name: String, bio: String, lamports_per_message: u64, bump: u8) -> Self {
        Self {
            tag: Tag::Profile,
            name,
            bio,
            lamports_per_message,
            bump,
        }
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

#[derive(BorshSerialize, BorshDeserialize, Debug, PartialEq)]
pub struct Thread {
    pub tag: Tag,
    pub msg_count: u32,
    pub user_1: Pubkey,
    pub user_2: Pubkey,
    pub bump: u8,
}

impl Thread {
    pub const SEED: &'static str = "thread";

    pub fn new(user_1: Pubkey, user_2: Pubkey, bump: u8) -> Self {
        Self {
            tag: Tag::Thread,
            msg_count: 0,
            user_1,
            user_2,
            bump,
        }
    }

    pub fn find_from_users_keys(
        user_1: &Pubkey,
        user_2: &Pubkey,
        program_id: &Pubkey,
    ) -> (Pubkey, u8) {
        let (key_1, key_2) = order_keys(user_1, user_2);
        let (thread_key, bump) = Pubkey::find_program_address(
            &[
                Thread::SEED.as_bytes(),
                &key_1.to_bytes(),
                &key_2.to_bytes(),
            ],
            program_id,
        );
        return (thread_key, bump);
    }

    pub fn create_from_user_keys(
        user_1: &Pubkey,
        user_2: &Pubkey,
        program_id: &Pubkey,
        bump: u8,
    ) -> Pubkey {
        let (key_1, key_2) = order_keys(user_1, user_2);
        let seeds = &[
            Thread::SEED.as_bytes(),
            &key_1.to_bytes(),
            &key_2.to_bytes(),
            &[bump],
        ];
        Pubkey::create_program_address(seeds, program_id).unwrap()
    }

    pub fn save(&self, mut dst: &mut [u8]) {
        self.serialize(&mut dst).unwrap()
    }

    pub fn from_account_info(a: &AccountInfo) -> Result<Thread, ProgramError> {
        let result: Thread =
            try_from_slice_checked(&a.data.borrow_mut(), Tag::Thread, MAX_THREAD_LEN)?;

        Ok(result)
    }

    pub fn increment_msg_count(&mut self) {
        self.msg_count += 1;
    }
}

#[derive(BorshSerialize, BorshDeserialize, PartialEq, Debug, Clone, Copy)]
pub enum MessageType {
    Encrypted,
    Unencrypted,
}

#[derive(BorshDeserialize, BorshSerialize, Debug, PartialEq)]
pub struct Message {
    pub tag: Tag,
    pub kind: MessageType,
    pub timestamp: UnixTimestamp,
    pub msg: Vec<u8>,
}

impl Message {
    pub const SEED: &'static str = "message";

    pub fn get_len(&self) -> usize {
        (1 + 1 + 8 + self.msg.len())
    }

    pub fn new(kind: MessageType, timestamp: UnixTimestamp, msg: Vec<u8>) -> Self {
        Self {
            tag: Tag::Message,
            kind,
            timestamp,
            msg,
        }
    }

    pub fn find_from_keys(
        index: u32,
        from_pk: &Pubkey,
        to_pk: &Pubkey,
        program_id: &Pubkey,
    ) -> (Pubkey, u8) {
        let i = index.to_string();
        let (message_key, bump) = Pubkey::find_program_address(
            &[
                Message::SEED.as_bytes(),
                i.as_bytes(),
                &from_pk.to_bytes(),
                &to_pk.to_bytes(),
            ],
            program_id,
        );
        return (message_key, bump);
    }

    pub fn create_from_keys(
        index: u32,
        from_key: &Pubkey,
        to_key: &Pubkey,
        program_id: &Pubkey,
        bump: u8,
    ) -> Pubkey {
        let (key_1, key_2) = order_keys(from_key, to_key);
        let i = index.to_string();
        let seeds = &[
            Message::SEED.as_bytes(),
            i.as_bytes(),
            &key_1.to_bytes(),
            &key_2.to_bytes(),
            &[bump],
        ];
        Pubkey::create_program_address(seeds, program_id).unwrap()
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
