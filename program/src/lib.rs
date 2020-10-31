mod error;
mod instruction;
mod state;

use solana_sdk::{
    account_info::AccountInfo, entrypoint, entrypoint::ProgramResult, pubkey::Pubkey,
};

use instruction::JabberInstruction;

entrypoint!(process_instruction);
fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    JabberInstruction::process(program_id, accounts, instruction_data)
}
