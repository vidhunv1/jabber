use crate::error::JabberError;
use crate::state::Profile;
use crate::utils::{check_account_key, check_account_owner, check_profile_params, check_signer};
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    program_error::ProgramError,
    pubkey::Pubkey,
};

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug)]
pub struct Params {
    pub name: String,
    pub bio: String,
    pub lamports_per_message: u64,
}

struct Accounts<'a, 'b: 'a> {
    profile_owner: &'a AccountInfo<'b>,
    profile: &'a AccountInfo<'b>,
}

impl<'a, 'b: 'a> Accounts<'a, 'b> {
    pub fn parse(
        program_id: &Pubkey,
        accounts: &'a [AccountInfo<'b>],
    ) -> Result<Self, ProgramError> {
        let accounts_iter = &mut accounts.iter();
        let accounts = Self {
            profile_owner: next_account_info(accounts_iter)?,
            profile: next_account_info(accounts_iter)?,
        };

        check_signer(accounts.profile_owner)?;
        check_account_owner(accounts.profile, program_id, JabberError::WrongProfileOwner)?;
        if accounts.profile.data.borrow()[0] == 0 {
            return Err(ProgramError::UninitializedAccount);
        }

        let profile = Profile::from_account_info(accounts.profile)?;

        let expected_user_profile_key =
            Profile::create_from_keys(accounts.profile_owner.key, &program_id, profile.bump);

        check_account_key(
            accounts.profile,
            &expected_user_profile_key,
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

    check_profile_params(&name, &bio)?;

    let accounts = Accounts::parse(program_id, accounts)?;

    let mut profile = Profile::from_account_info(&accounts.profile)?;

    profile.lamports_per_message = lamports_per_message;
    profile.bio = bio;
    profile.name = name;

    profile.save(&mut accounts.profile.data.borrow_mut());

    Ok(())
}
