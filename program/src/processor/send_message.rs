use crate::utils::{check_account_key, check_account_owner, check_signer, try_from_slice_checked};
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    clock::Clock,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
    sysvar::Sysvar,
};

use crate::error::JabberError;
use crate::state::{Jabber, Message, Profile, Tag, Thread};

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug)]
pub struct Params {
    kind: u8,
    message: Vec<u8>,
}

struct Accounts<'a, 'b: 'a> {
    sender: &'a AccountInfo<'b>,
    receiver: &'a AccountInfo<'b>,
    sender_thread: &'a AccountInfo<'b>,
    received_thread: &'a AccountInfo<'b>,
    sender_profile: &'a AccountInfo<'b>,
    receiver_profile: &'a AccountInfo<'b>,
    message: &'a AccountInfo<'b>,
    jabber: &'a AccountInfo<'b>,
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
            sender_thread: next_account_info(accounts_iter)?,
            received_thread: next_account_info(accounts_iter)?,
            sender_profile: next_account_info(accounts_iter)?,
            receiver_profile: next_account_info(accounts_iter)?,
            message: next_account_info(accounts_iter)?,
            jabber: next_account_info(accounts_iter)?,
        };

        check_signer(accounts.sender)?;
        if accounts.sender.key == accounts.receiver.key {
            return Err(ProgramError::InvalidArgument);
        }

        // Check the jabber account?

        Ok(accounts)
    }
}

pub(crate) fn process(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    params: Params,
) -> ProgramResult {
    let accounts = Accounts::parse(program_id, accounts)?;

    let timestamp = Clock::get()?.unix_timestamp;

    if accounts.sender_profile.try_data_len()? < Profile::MIN_SPACE {
        return Err(ProgramError::UninitializedAccount);
    }
    let r_profile_exists = accounts.receiver_profile.try_data_len()? >= Profile::MIN_SPACE;

    // Are the profile accounts valid?
    if *accounts.sender_profile.key != Profile::create_with_seed(&accounts.sender.key, program_id)?
        || *accounts.receiver_profile.key
            != Profile::create_with_seed(&accounts.receiver.key, program_id)?
    {
        return Err(JabberError::AccountNotDeterministic.into());
    }

    // Are the thread accounts valid?
    if *accounts.sender_thread.key
        != Thread::create_with_seed(&accounts.sender.key, &accounts.receiver.key, program_id)?
        || *accounts.received_thread.key
            != Thread::create_with_seed(&accounts.receiver.key, &accounts.sender.key, program_id)?
    {
        return Err(JabberError::AccountNotDeterministic.into());
    }

    let r_msg_count = match Thread::from_account_info(&accounts.received_thread) {
        Ok(u) => u.msg_count,
        _ => 0,
    };

    // Choose the oldest Thread account.
    let thread_acc = if r_msg_count > 0 {
        accounts.received_thread
    } else {
        if accounts.sender_thread.try_data_len()? < Thread::MIN_SPACE {
            return Err(ProgramError::AccountDataTooSmall);
        }
        accounts.sender_thread
    };

    if thread_acc.owner != program_id || accounts.sender_profile.owner != program_id {
        return Err(ProgramError::InvalidAccountData);
    }

    let rent = &Rent::get()?;

    if !rent.is_exempt(thread_acc.lamports(), thread_acc.data_len()) {
        return Err(JabberError::AccountNotRentExempt.into());
    }

    let mut thread = Thread::from_account_info(thread_acc).map(|mut u| {
        if u.msg_count == 0 {
            u.msg_count = 1;
        }
        u
    })?;

    // Message should be valid
    if *accounts.message.key
        != Message::create_with_seed(
            thread.msg_count,
            accounts.sender.key,
            accounts.receiver.key,
            program_id,
        )?
    {
        msg!("Message account invalid");
        return Err(JabberError::AccountNotDeterministic.into());
    }

    // first time?
    if thread.msg_count == 1 {
        thread.u1_pk = *accounts.sender.key;
        thread.u2_pk = *accounts.receiver.key;

        let mut s = Profile::from_account_info(accounts.sender_profile)?;
        // Update the thread tail for sender.
        thread.prev_thread_u1_pk = s.thread_tail_pk;
        s.thread_tail_pk = Some(*thread_acc.key);
        s.save(&mut accounts.sender_profile.try_borrow_mut_data()?);

        // Update the thread tail for receiver. We add it to the program
        // root account if their profile does not exist.
        if r_profile_exists {
            let mut r = Profile::from_account_info(accounts.receiver_profile)?;
            thread.prev_thread_u2_pk = r.thread_tail_pk;
            r.thread_tail_pk = Some(*thread_acc.key);
            r.save(&mut accounts.receiver_profile.try_borrow_mut_data()?);
        } else {
            // The reciever is not registered, point thread to unregistered users.
            let mut jabber = Jabber::from_account_info(&accounts.jabber)?;
            thread.prev_thread_u2_pk = jabber.unregistered_thread_tail_pk;
            jabber.unregistered_thread_tail_pk = Some(*thread_acc.key);
            jabber.save(&mut accounts.receiver_profile.try_borrow_mut_data()?);
        }
    }

    let message = Message {
        tag: Tag::Message,
        kind: params.kind,
        msg: params.message,
        timestamp: timestamp,
    };
    message.save(&mut accounts.message.try_borrow_mut_data()?);
    thread.msg_count = thread.msg_count + 1;
    thread.save(&mut thread_acc.try_borrow_mut_data()?);

    Ok(())
}
