use crate::error::JabberError;
use crate::state::{Serdes, UserProfile};

use borsh::{BorshDeserialize, BorshSerialize};
use solana_sdk::{
    account_info::next_account_info, account_info::AccountInfo, entrypoint::ProgramResult, info,
    program_error::ProgramError, pubkey::Pubkey,
};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum JabberInstruction {
    /// 0. `[is_signer]` The user
    /// 1. `[writable]` deterministic user profile account with seed `profile`'
    SetUserProfile {
        name: Option<String>,
        bio: Option<String>,
        lamports_per_message: Option<u64>,
    },
}

impl JabberInstruction {
    pub fn process(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        let instruction = JabberInstruction::try_from_slice(&instruction_data)
            .map_err(|_| ProgramError::InvalidInstructionData)?;
        info!(&format!("Instruction {:?}", instruction));
        let accounts_iter = &mut accounts.iter();
        match instruction {
            JabberInstruction::SetUserProfile {
                name,
                bio,
                lamports_per_message,
            } => {
                let user_account = next_account_info(accounts_iter)?;
                if !user_account.is_signer {
                    return Err(ProgramError::MissingRequiredSignature);
                }

                let user_profile_account = next_account_info(accounts_iter)?;
                // the user_profile account should be deterministic
                let expected_user_profile_pk =
                    Pubkey::create_with_seed(user_account.key, UserProfile::SEED, program_id)?;
                if expected_user_profile_pk != *user_profile_account.key {
                    return Err(JabberError::AccountNotDeterministic.into());
                }
                // the user_profile account should be owned by the program
                if user_profile_account.owner != program_id {
                    return Err(ProgramError::InvalidAccountData);
                }
                // Should have enough space allocated
                if user_profile_account.try_data_len().unwrap() < 228 {
                    return Err(ProgramError::AccountDataTooSmall);
                }

                let decoded = UserProfile::unpack(&user_profile_account.try_borrow_data()?);

                let mut out = match decoded {
                    Ok(u) => u,
                    Err(_) => UserProfile::default(),
                };
                if let Some(i) = lamports_per_message {
                    out.lamports_per_message = i;
                }
                if let Some(i) = name {
                    out.name = Some(i);
                }
                if let Some(i) = bio {
                    out.bio = Some(i);
                }

                let mut user_profile_data = user_profile_account.try_borrow_mut_data()?;
                out.pack(&mut user_profile_data);

                Ok(())
            }
        }
    }
}

#[cfg(not(target_arch = "bpf"))]
solana_sdk::program_stubs!();

#[cfg(test)]
mod test {
    use super::*;
    use solana_sdk::{clock::Epoch, pubkey::Pubkey};

    fn rand_pk() -> Pubkey {
        Pubkey::new(&rand::random::<[u8; 32]>())
    }

    fn sys_pk() -> Pubkey {
        let system_account_bytes: &[u8] = &[
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0,
        ];
        Pubkey::new(system_account_bytes)
    }

    #[test]
    fn set_user_profile() {
        let program_id = rand_pk();
        let signer_account_pk = Pubkey::new(&[
            178, 171, 88, 132, 51, 181, 205, 183, 31, 94, 121, 0, 179, 9, 133, 234, 102, 162, 50,
            170, 249, 36, 249, 137, 57, 1, 205, 63, 49, 201, 228, 25,
        ]);
        let mut lamports = 0;
        let mut data = vec![0; 0];
        let owner = sys_pk();
        let signer_account = AccountInfo::new(
            &signer_account_pk,
            true,
            true,
            &mut lamports,
            &mut data,
            &owner,
            false,
            Epoch::default(),
        );
        let profile_account_pk =
            Pubkey::create_with_seed(&signer_account_pk, UserProfile::SEED, &program_id).unwrap();
        let mut profile_account_data = vec![0; 300];
        let mut lamports = 0;
        let profile_account = AccountInfo::new(
            &profile_account_pk,
            false,
            true,
            &mut lamports,
            &mut profile_account_data,
            &program_id,
            false,
            Epoch::default(),
        );
        let accounts = [signer_account, profile_account];

        let instruction = JabberInstruction::SetUserProfile {
            name: Some("Alpaca".into()),
            bio: Some("paca paca".into()),
            lamports_per_message: None,
        };
        let instruction_data = instruction.try_to_vec().unwrap();
        JabberInstruction::process(&program_id, &accounts, &instruction_data).unwrap();
        let decoded_profile = UserProfile::unpack(&accounts[1].data.try_borrow().unwrap()).unwrap();
        assert_eq!(decoded_profile.name, Some("Alpaca".into()));
        assert_eq!(decoded_profile.bio, Some("paca paca".into()));
        assert_eq!(decoded_profile.lamports_per_message, 0);

        let instruction = JabberInstruction::SetUserProfile {
            name: None,
            bio: Some("hey!".into()),
            lamports_per_message: Some(10),
        };
        let instruction_data = instruction.try_to_vec().unwrap();
        JabberInstruction::process(&program_id, &accounts, &instruction_data).unwrap();
        let decoded_profile = UserProfile::unpack(&accounts[1].data.try_borrow().unwrap()).unwrap();
        assert_eq!(decoded_profile.name, Some("Alpaca".into()));
        assert_eq!(decoded_profile.bio, Some("hey!".into()));
        assert_eq!(decoded_profile.lamports_per_message, 10);
    }
}
