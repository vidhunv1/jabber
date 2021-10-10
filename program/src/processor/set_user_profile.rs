use crate::error::JabberError;
use crate::state::Profile;
use crate::utils::{check_account_key, check_account_owner, check_signer};
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    program_error::ProgramError,
    pubkey::Pubkey,
};

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug)]
pub struct Params {
    name: Option<String>,
    bio: Option<String>,
    lamports_per_message: Option<u64>,
}

struct Accounts<'a, 'b: 'a> {
    user: &'a AccountInfo<'b>,
    user_profile: &'a AccountInfo<'b>,
}

impl<'a, 'b: 'a> Accounts<'a, 'b> {
    pub fn parse(
        program_id: &Pubkey,
        accounts: &'a [AccountInfo<'b>],
    ) -> Result<Self, ProgramError> {
        let accounts_iter = &mut accounts.iter();
        let accounts = Self {
            user: next_account_info(accounts_iter)?,
            user_profile: next_account_info(accounts_iter)?,
        };

        check_signer(accounts.user)?;
        check_account_owner(
            accounts.user_profile,
            program_id,
            JabberError::WrongProfileOwner,
        )?;
        if accounts.user_profile.try_data_len().unwrap() < Profile::MIN_SPACE {
            return Err(ProgramError::AccountDataTooSmall);
        }

        let expected_user_profile_pk = Profile::create_with_seed(accounts.user.key, &program_id)?;

        check_account_key(
            accounts.user_profile,
            &expected_user_profile_pk,
            JabberError::AccountNotDeterministic,
        )?;

        Ok(accounts)
    }
}

pub(crate) fn process(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    params: Params,
) -> ProgramResult {
    let Params {
        name,
        bio,
        lamports_per_message,
    } = params;

    let accounts = Accounts::parse(program_id, accounts)?;

    let profile = Profile::from_account_info(&accounts.user_profile).unwrap_or(Profile::default());

    profile.lamports_per_message = lamports_per_message.unwrap_or(0);
    profile.bio = bio;
    profile.name = name;

    profile.save(&mut accounts.user_profile.try_borrow_mut_data()?);

    Ok(())
}
