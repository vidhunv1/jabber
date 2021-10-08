use borsh::BorshDeserialize;
use solana_program::{
    account_info::AccountInfo, entrypoint::ProgramResult, msg, program_error::ProgramError,
    pubkey::Pubkey,
};

use crate::instruction::JabberInstruction;

pub mod send_message;
pub mod set_user_profile;

pub struct Processor {}

impl Processor {
    pub fn process_instruction(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        msg!("Beginning processing");
        let instruction = JabberInstruction::try_from_slice(instruction_data)
            .map_err(|_| ProgramError::InvalidInstructionData)?;
        msg!("Instruction unpacked");

        match instruction {
            JabberInstruction::SetUserProfile(params) => {
                msg!("Instruction: Set user profile");
                set_user_profile::process(program_id, accounts, params)?;
            }
            JabberInstruction::SendMessage(params) => {
                msg!("Instruction: Send message");
                send_message::process(program_id, accounts, params)?;
            }
        }
        Ok(())
    }
}
