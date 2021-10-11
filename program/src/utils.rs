use borsh::BorshDeserialize;
use solana_program::{
    account_info::AccountInfo, borsh::try_from_slice_unchecked, entrypoint::ProgramResult, msg,
    program::invoke_signed, program_error::ProgramError, pubkey::Pubkey, rent::Rent,
    system_instruction::create_account, sysvar::Sysvar,
};

use crate::state::{MAX_BIO_LENGTH, MAX_NAME_LENGTH};
use crate::{error::JabberError, state::Tag};
use std::cmp::Ordering::Less;

// Safety verification functions
pub fn check_account_key(
    account: &AccountInfo,
    key: &Pubkey,
    error: JabberError,
) -> Result<(), JabberError> {
    if account.key != key {
        return Err(error);
    }
    Ok(())
}

pub fn check_account_owner(
    account: &AccountInfo,
    owner: &Pubkey,
    error: JabberError,
) -> Result<(), JabberError> {
    if account.owner != owner {
        return Err(error);
    }
    Ok(())
}

pub fn check_signer(account: &AccountInfo) -> ProgramResult {
    if !(account.is_signer) {
        return Err(ProgramError::MissingRequiredSignature);
    }
    Ok(())
}

pub fn try_from_slice_checked<T: BorshDeserialize>(
    data: &[u8],
    data_type: Tag,
    data_size: usize,
) -> Result<T, ProgramError> {
    if (data[0] != data_type as u8 && data[0] != Tag::Uninitialized as u8)
        || data.len() != data_size
    {
        return Err(JabberError::DataTypeMismatch.into());
    }

    let result: T = try_from_slice_unchecked(data)?;

    Ok(result)
}

pub fn create_program_account<'a, 'b: 'a>(
    space: u64,
    from_account: &'a AccountInfo<'b>,
    to_account: &'a AccountInfo<'b>,
    system_program: &'a AccountInfo<'b>,
    seeds: &[u8],
    program_id: &Pubkey,
) -> ProgramResult {
    let lamports = Rent::get()?.minimum_balance(space as usize);

    let allocate_account = create_account(
        from_account.key, // Fee payer
        to_account.key,
        lamports,
        space,
        program_id,
    );

    invoke_signed(
        &allocate_account,
        &[
            system_program.clone(),
            from_account.clone(),
            to_account.clone(),
        ],
        &[&[seeds]],
    )
}

pub fn check_rent_exempt(account: &AccountInfo) -> ProgramResult {
    let rent = Rent::get()?;
    if !rent.is_exempt(account.lamports(), account.data_len()) {
        return Err(JabberError::AccountNotRentExempt.into());
    }
    Ok(())
}

pub fn check_profile_params(name: &String, bio: &String) -> ProgramResult {
    if bio.len() > MAX_BIO_LENGTH {
        msg!("Bio is too long - max is {}", MAX_BIO_LENGTH);
        return Err(ProgramError::InvalidArgument);
    }
    if name.len() > MAX_NAME_LENGTH {
        msg!("Name is too long - max is {}", MAX_NAME_LENGTH);
        return Err(ProgramError::InvalidArgument);
    }
    Ok(())
}

pub fn order_keys(key_1: &Pubkey, key_2: &Pubkey) -> (Pubkey, Pubkey) {
    let order = key_1.to_string().cmp(&key_2.to_string());
    if order == Less {
        return (*key_1, *key_2);
    }
    return (*key_2, *key_1);
}
