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
    program::invoke_signed,
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
    system_instruction::create_account,
    system_program,
    sysvar::Sysvar,
};

use crate::error::JabberError;
use crate::state::{Thread, MAX_THREAD_LEN};

#[derive(BorshDeserialize, BorshSerialize, Debug)]
pub struct Params {
    sender_key: Pubkey,
    receiver_key: Pubkey,
}

struct Accounts<'a, 'b: 'a> {
    system_program: &'a AccountInfo<'b>,
    thread: &'a AccountInfo<'b>,
    fee_payer: &'a AccountInfo<'b>,
}

impl<'a, 'b: 'a> Accounts<'a, 'b> {
    pub fn parse(
        _program_id: &Pubkey,
        accounts: &'a [AccountInfo<'b>],
    ) -> Result<Self, ProgramError> {
        let accounts_iter = &mut accounts.iter();

        let accounts = Self {
            system_program: next_account_info(accounts_iter)?,
            thread: next_account_info(accounts_iter)?,
            fee_payer: next_account_info(accounts_iter)?,
        };

        check_account_key(
            accounts.system_program,
            &system_program::ID,
            JabberError::WrongSystemProgramAccount,
        )?;

        Ok(accounts)
    }
}

pub(crate) fn process(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    params: Params,
) -> ProgramResult {
    let accounts = Accounts::parse(program_id, accounts)?;
    let Params {
        sender_key,
        receiver_key,
    } = params;

    let (thread_key, bump) = Thread::find_from_users_keys(&receiver_key, &sender_key, program_id);

    check_account_key(
        accounts.thread,
        &thread_key,
        JabberError::AccountNotDeterministic,
    )?;

    let lamports = Rent::get()?.minimum_balance(MAX_THREAD_LEN);

    let allocate_account = create_account(
        accounts.fee_payer.key,
        &thread_key,
        lamports,
        MAX_THREAD_LEN as u64,
        program_id,
    );

    invoke_signed(
        &allocate_account,
        &[
            accounts.system_program.clone(),
            accounts.fee_payer.clone(),
            accounts.thread.clone(),
        ],
        &[&[
            Thread::SEED.as_bytes(),
            &receiver_key.to_bytes(),
            &sender_key.to_bytes(),
        ]],
    )?;

    let thread = Thread::new(sender_key, receiver_key, bump);
    thread.save(&mut accounts.thread.try_borrow_mut_data()?);

    Ok(())
}
