use solana_sdk::{decode_error::DecodeError, program_error::ProgramError};
use thiserror::Error;

#[derive(Error, Debug)]
#[repr(u8)]
pub enum JabberError {
    #[error("Account not generated deterministically")]
    AccountNotDeterministic = 0,
    #[error("Account not Authorized")]
    AccountNotAuthorized = 1,
    #[error("Account not rent exempt")]
    AccountNotRentExempt = 2,
    #[error("Chat thread exists")]
    ChatThreadExists = 3,
}
impl From<JabberError> for ProgramError {
    fn from(e: JabberError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
impl<T> DecodeError<T> for JabberError {
    fn type_of() -> &'static str {
        "Jabber Error"
    }
}
