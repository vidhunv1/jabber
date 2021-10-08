use solana_program::{
    account_info::AccountInfo, entrypoint::ProgramResult, program_error::ProgramError,
    pubkey::Pubkey,
};

use crate::error::DexError;

// Safety verification functions
pub fn check_account_key(
    account: &AccountInfo,
    key: &Pubkey,
    error: DexError,
) -> Result<(), DexError> {
    if account.key != key {
        return Err(error);
    }
    Ok(())
}

pub fn check_account_owner(
    account: &AccountInfo,
    owner: &Pubkey,
    error: DexError,
) -> Result<(), DexError> {
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
