use crate::{
    state::MessageType,
    utils::{check_account_key, check_account_owner, check_rent_exempt, check_signer},
};
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    clock::Clock,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
    system_instruction::create_account,
    sysvar::Sysvar,
};

use crate::error::JabberError;
use crate::state::{Message, Profile, Tag, Thread};

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug)]
pub struct Params {
    kind: MessageType,
    message: Vec<u8>,
}

struct Accounts<'a, 'b: 'a> {
    sender: &'a AccountInfo<'b>,
    receiver: &'a AccountInfo<'b>,
    receiver_thread: &'a AccountInfo<'b>,
    receiver_profile: &'a AccountInfo<'b>,
    message: &'a AccountInfo<'b>,
}

impl<'a, 'b: 'a> Accounts<'a, 'b> {
    pub fn parse(
        program_id: &Pubkey,
        accounts: &'a [AccountInfo<'b>],
    ) -> Result<Self, ProgramError> {
        let accounts_iter = &mut accounts.iter();
        let accounts = Self {
            sender: next_account_info(accounts_iter)?,
            receiver: next_account_info(accounts_iter)?,
            receiver_thread: next_account_info(accounts_iter)?,
            receiver_profile: next_account_info(accounts_iter)?,
            message: next_account_info(accounts_iter)?,
        };

        check_signer(accounts.sender)?;
        if accounts.sender.key == accounts.receiver.key {
            return Err(ProgramError::InvalidArgument);
        }
        check_account_owner(
            accounts.receiver_thread,
            program_id,
            JabberError::WrongThreadAccountOwner,
        )?;
        check_account_owner(
            accounts.message,
            program_id,
            JabberError::WrongMessageAccount,
        )?;
        check_rent_exempt(accounts.receiver_thread)?;

        Ok(accounts)
    }
}

pub(crate) fn process(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    params: Params,
) -> ProgramResult {
    let accounts = Accounts::parse(program_id, accounts)?;
    check_accounts(&accounts, program_id)?;

    let Params { kind, message } = params;

    let mut thread = Thread::from_account_info(&accounts.receiver_thread)?;

    let (message_key, _) = Message::find_from_keys(
        thread.msg_count,
        accounts.sender.key,
        accounts.receiver.key,
        program_id,
    );

    check_account_key(
        accounts.message,
        &message_key,
        JabberError::AccountNotDeterministic,
    )?;

    let now = Clock::get()?.unix_timestamp;
    let message = Message::new(kind, now, message);
    let message_len = message.get_len();
    let lamports = Rent::get()?.minimum_balance(message_len);

    let allocate_account = create_account(
        accounts.sender.key,
        &message_key,
        lamports,
        message_len as u64,
        program_id,
    );

    message.save(&mut accounts.message.try_borrow_mut_data()?);

    thread.increment_msg_count();
    thread.save(&mut accounts.receiver_thread.try_borrow_mut_data()?);

    Ok(())
}

fn check_accounts(accounts: &Accounts, program_id: &Pubkey) -> ProgramResult {
    Ok(())
}
